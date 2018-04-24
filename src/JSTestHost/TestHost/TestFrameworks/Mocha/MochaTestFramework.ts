import { ITestFramework, TestCaseEventArgs, TestSuiteEventArgs, TestSessionEventArgs, FailedExpectation, ITestFrameworkEvents }
    from '../../../ObjectModel/TestFramework';
import { EnvironmentType, TestCase, TestOutcome } from '../../../ObjectModel/Common';
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
    public testFrameworkEvents: ITestFrameworkEvents;
    public readonly executorUri: string = 'executor://MochaTestAdapter/v1';
    public readonly environmentType: EnvironmentType;

    private mochaLib: any;
    private mocha: Mocha;
    private source: string;
    private sessionEventArgs: TestSessionEventArgs;
    private suiteStack: Array<TestSuiteEventArgs>;
    private activeSpec: TestCaseEventArgs;
    private testCollection: Map<string, TestCase>;
    private testExecutionCount: Map<string, number>;

    private getMocha() {
        switch (this.environmentType) {
            case EnvironmentType.NodeJS:
            // tslint:disable-next-line
                return require('mocha');
            default:
                throw new Exception('Not implemented.', ExceptionType.NotImplementedException);
        }
    }

    constructor(testFrameworkEvents: ITestFrameworkEvents, envrionmentType: EnvironmentType) {
        this.testFrameworkEvents = testFrameworkEvents;
        this.environmentType = envrionmentType;
        this.suiteStack = [];
        this.testExecutionCount = new Map();

        this.mochaLib = this.getMocha();
        this.mocha = new this.mochaLib({
            reporter: 'base'
        });
    }

    public startExecutionWithSource(source: string): void {
        this.source = source;

        // A known issue with mocha that start event is called before we can subscribe
        // this.mochaRunner.on('start', (args) => { this.handleReporterEvents(ReporterEvent.SessionStarted, args); });
        this.handleReporterEvents(ReporterEvent.SessionStarted, null);

        this.mocha.addFile(source);
        this.initializeReporter(this.mocha.run());
    }

    public startExecutionWithTests(source: string, testCollection: Map<string, TestCase>): void {
        this.testCollection = testCollection;
        this.startExecutionWithSource(source);
    }

    public startDiscovery(source: string): void {
        // tslint:disable:no-empty
        this.mochaLib.Suite.prototype.beforeAll = () => {};
        this.mochaLib.Suite.prototype.afterAll = () => {};
        this.mochaLib.Suite.prototype.beforeEach = () => {};
        this.mochaLib.Suite.prototype.afterEach = () => {};
        this.mochaLib.Suite.prototype.it = () => {};
        // tslint:enable:no-empty

        this.startExecutionWithSource(source);
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

                this.testFrameworkEvents.onTestSessionStart.raise(this, this.sessionEventArgs);
                break;

            case ReporterEvent.SessionDone:
                this.sessionEventArgs.EndTime = new Date();
                this.sessionEventArgs.InProgress = false;

                this.testFrameworkEvents.onTestSessionEnd.raise(this, this.sessionEventArgs);
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

                this.testFrameworkEvents.onTestSuiteStart.raise(this, suiteEventArgs);
                break;

            case ReporterEvent.SuiteDone:
                if (!this.suiteStack.length) {
                    break;
                }

                const suiteEndEventArgs = this.suiteStack.pop();

                suiteEndEventArgs.InProgress = false;
                suiteEndEventArgs.EndTime = new Date();

                this.testFrameworkEvents.onTestSuiteEnd.raise(this, suiteEndEventArgs);
                break;

            case ReporterEvent.SpecStarted:
                let executionCount = 1;

                if (this.testExecutionCount.has(args.fullTitle())) {
                    executionCount = this.testExecutionCount.get(args.fullTitle()) + 1;
                }
                this.testExecutionCount.set(args.fullTitle(), executionCount);

                const testCase = new TestCase(this.source, args.fullTitle() + ' ' + executionCount, this.executorUri);
                this.applyTestCaseFilter(args, testCase);
                
                testCase.DisplayName = args.title;

                this.activeSpec = <TestCaseEventArgs> {
                    TestCase: testCase,
                    FailedExpectations: [],
                    Outcome: TestOutcome.None,
                    Source: this.source,
                    StartTime: new Date(),
                    InProgress: true,
                    EndTime: null
                };

                this.testFrameworkEvents.onTestCaseStart.raise(this, this.activeSpec);
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

                this.testFrameworkEvents.onTestCaseEnd.raise(this, this.activeSpec);
                break;
        }
    }

    private applyTestCaseFilter(args: any, testCase: TestCase) {
        if (this.testCollection) {
            if (!this.testCollection.has(testCase.Id)) {
                args.pending = true;
            }
        }
    }

    private initializeReporter(runner: any) {
        runner.setMaxListeners(20);

        runner.on('suite', (args) => { this.handleReporterEvents(ReporterEvent.SuiteStarted, args); });
        runner.on('suite end', (args) => { this.handleReporterEvents(ReporterEvent.SuiteDone, args); });
        runner.on('test', (args) => { this.handleReporterEvents(ReporterEvent.SpecStarted, args); });
        runner.on('test end', (args) => { this.handleReporterEvents(ReporterEvent.SpecDone, args); });
        runner.on('end', (args) => { this.handleReporterEvents(ReporterEvent.SessionDone, args); });
    }
}