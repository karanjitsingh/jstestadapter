import {
    ITestFramework,
    TestCaseEventArgs,
    TestSuiteEventArgs,
    TestSessionEventArgs,
    FailedExpectation
} from '../../../ObjectModel/TestFramework';

import { EnvironmentType, TestCase, TestOutcome } from '../../../ObjectModel/Common';
import { Event } from '../../../Events/Event';
import { Exception, ExceptionType } from '../../../Exceptions/Exception';

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
    public readonly environmentType: EnvironmentType;

    private mochaLib: any;
    private mocha: Mocha;
    private source: string;
    private sessionEventArgs: TestSessionEventArgs;
    private suiteStack: Array<TestSuiteEventArgs>;
    private activeSpec: TestCaseEventArgs;

    private getMocha() {
        switch (this.environmentType) {
            case EnvironmentType.NodeJS:
            // tslint:disable-next-line
                return require('mocha');
            default:
                throw new Exception('Not implemented.', ExceptionType.NotImplementedException);
        }
    }

    constructor(envrionmentType: EnvironmentType) {
        this.environmentType = envrionmentType;
        this.suiteStack = [];

        this.mochaLib = this.getMocha();
        this.mocha = new this.mochaLib({
            reporter: 'base'
        });
    }

    public startExecution(source: string): void {
        this.source = source;

        // A known issue with mocha that start event is called before we can subscribe
        // this.mochaRunner.on('start', (args) => { this.handleReporterEvents(ReporterEvent.SessionStarted, args); });
        this.handleReporterEvents(ReporterEvent.SessionStarted, null);

        this.mocha.addFile(source);
        try {
            this.initializeReporter(this.mocha.run());
        } catch (e) {
            console.log(e);
        }
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
                console.log('session started');
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
                console.log('session done');
                this.sessionEventArgs.EndTime = new Date();
                this.sessionEventArgs.InProgress = false;

                this.onTestSessionEnd.raise(this, this.sessionEventArgs);
                break;

            case ReporterEvent.SuiteStarted:
                console.log('suite started');
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
                console.log('suite done');
                if (!this.suiteStack.length) {
                    break;
                }

                const suiteEndEventArgs = this.suiteStack.pop();

                suiteEndEventArgs.InProgress = false;
                suiteEndEventArgs.EndTime = new Date();

                this.onTestSuiteEnd.raise(this, suiteEndEventArgs);
                break;

            case ReporterEvent.SpecStarted:
                console.log('spec started');

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
                console.log('spec done');

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

    private initializeReporter(runner: any) {
        runner.setMaxListeners(20);

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