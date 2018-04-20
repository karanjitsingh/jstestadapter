import { ITestFramework } from '../ITestFramework';
import { Event, IEventArgs } from '../../../Events/Event';
import { IEnvironment, EnvironmentType } from '../../../Environment/IEnvironment';
import { TestCaseEventArgs, TestSuiteEventArgs, TestSessionEventArgs, FailedExpectation } from '../TestFrameworkEventArgs';
import { TestCase } from '../../../ObjectModel/TestCase';
import { TestOutcome } from '../../../ObjectModel/TestOutcome';
import { Exception, ExceptionType } from '../../../Exceptions/Exception';
import { EventEmitter } from 'events';

enum ReporterEvent {
    SessionStarted,
    SessionDone,
    SuiteStarted,
    SuiteDone,
    SpecStarted,
    SpecDone
}

export class MochaTestFramework implements ITestFramework {
    public onTestCaseStart: Event<TestCaseEventArgs>;
    public onTestCaseEnd: Event<TestCaseEventArgs>;
    public onTestSuiteStart: Event<TestSuiteEventArgs>;
    public onTestSuiteEnd: Event<TestSuiteEventArgs>;
    public onTestSessionStart: Event<TestSessionEventArgs>;
    public onTestSessionEnd: Event<TestSessionEventArgs>;
    public readonly executorUri: string = 'executor://MochaTestAdapter/v1';

    private mochaLib: any;
    private mochaRunner: Mocha.IRunner;
    private mocha: Mocha;
    private environment: IEnvironment;
    private source: string;
    private sessionEventArgs: TestSessionEventArgs;
    private suiteStack: Array<TestSuiteEventArgs>;
    private activeSpec: TestCaseEventArgs;

    private getMocha() {
        switch (this.environment.environmentType) {
            case EnvironmentType.NodeJS:
            // tslint:disable-next-line
                return require('mocha');
            default:
                throw new Exception('Not implemented.', ExceptionType.NotImplementedException);
        }
    }

    constructor(environment: IEnvironment) {
        this.environment = environment;
        this.suiteStack = [];

        this.initializeEvents();

        this.mochaLib = this.getMocha();
        this.mocha = new this.mochaLib({
            reporter: 'base'
        });
    }

    public startExecution(source: string): void {
        this.source = source;

        this.mocha.addFile(source);
        this.initializeReporter(this.mocha.run());
    }

    public startDiscovery(source: string): void {
        // tslint:disable:no-empty
        this.mochaLib.Suite.prototype.beforeAll = () => {};
        this.mochaLib.Suite.prototype.afterAll = () => {};
        this.mochaLib.Suite.prototype.beforeEach = () => {};
        this.mochaLib.Suite.prototype.afterEach = () => {};
        this.mochaLib.Suite.prototype.it = () => {};
        // tslint:enable:no-empty
    }

    private handleReporterEvents(reporterEvent: ReporterEvent, args: any) {
        switch (reporterEvent) {
            case ReporterEvent.SessionStarted:
                const start = new Date();
                this.sessionEventArgs = {
                    SessionId: String(start.getTime()),
                    Source: this.source,
                    StartTime: start,
                    InProgress: true,
                    EndTime: null
                };

                this.onTestSessionStart.raise(this, this.sessionEventArgs);
                break;

            case ReporterEvent.SessionDone:
                this.sessionEventArgs.EndTime = new Date();
                this.sessionEventArgs.InProgress = false;

                this.onTestSessionEnd.raise(this, this.sessionEventArgs);
                break;

            case ReporterEvent.SuiteStarted:

                const suiteEventArgs: TestSuiteEventArgs = {
                    Name: args.title,
                    Source: this.source,
                    StartTime: new Date(),
                    InProgress: true,
                    EndTime: undefined
                };

                this.suiteStack.push(suiteEventArgs);

                this.onTestSuiteStart.raise(this, suiteEventArgs);
                break;

            case ReporterEvent.SuiteDone:
                if (!this.suiteStack.length) {
                    break;
                }

                const suiteEndEventArgs = this.suiteStack.pop();

                suiteEndEventArgs.InProgress = false;
                suiteEndEventArgs.EndTime = new Date();

                this.onTestSuiteEnd.raise(this, suiteEndEventArgs);
                break;

            case ReporterEvent.SpecStarted:

                const testCase = new TestCase(this.source, args.fullTitle(), this.executorUri);
                testCase.displayName = args.title;

                this.activeSpec = <TestCaseEventArgs> {
                    TestCase: testCase,
                    FailedExpectations: [],
                    Outcome: TestOutcome.None,
                    Source: this.source,
                    StartTime: new Date(),
                    InProgress: true,
                    EndTime: null
                };

                this.onTestCaseStart.raise(this, this.activeSpec);
                break;

            case ReporterEvent.SpecDone:
                this.activeSpec.InProgress = false;
                this.activeSpec.EndTime = new Date();

                if (args.pending === true) {
                    this.activeSpec.Outcome = TestOutcome.Skipped;
                }

                if (args.state === 'passed') {
                    this.activeSpec.Outcome = TestOutcome.Passed;
                } else if (args.state === 'failed') {
                    this.activeSpec.Outcome = TestOutcome.Failed;
                    this.activeSpec.FailedExpectations.push(<FailedExpectation> {
                        Message: args.err.message,
                        StackTrace: args.err.stack
                    });
                }

                this.onTestCaseEnd.raise(this, this.activeSpec);
                break;
        }
    }

    private initializeEvents() {
        this.onTestCaseStart = this.environment.createEvent();
        this.onTestCaseEnd = this.environment.createEvent();
        this.onTestSuiteStart = this.environment.createEvent();
        this.onTestSuiteEnd = this.environment.createEvent();
        this.onTestSessionStart = this.environment.createEvent();
        this.onTestSessionEnd = this.environment.createEvent();
    }

    private initializeReporter(runner: any) {
        runner.setMaxListeners(20);

        // A known issue with mocha that start event is called before we can subscribe
        // this.mochaRunner.on('start', (args) => { this.handleReporterEvents(ReporterEvent.SessionStarted, args); });
        this.handleReporterEvents(ReporterEvent.SessionStarted, null);

        runner.on('suite', (args) => {
            this.handleReporterEvents(ReporterEvent.SuiteStarted, args);
        });
        runner.on('suite end', (args) => {
            this.handleReporterEvents(ReporterEvent.SuiteDone, args);
        });
        runner.on('test', (args) => {
            this.handleReporterEvents(ReporterEvent.SpecStarted, args);
        });
        runner.on('test end', (args) => {
            this.handleReporterEvents(ReporterEvent.SpecDone, args);
        });
        runner.on('end', (args) => {
            this.handleReporterEvents(ReporterEvent.SessionDone, args);
        });
    }
}