import { ITestFramework, TestCaseEventArgs, TestSuiteEventArgs, TestSessionEventArgs, FailedExpectation }
    from '../../../ObjectModel/TestFramework';
import { EnvironmentType, TestCase, TestOutcome } from '../../../ObjectModel/Common';
import { Exception, ExceptionType } from '../../../Exceptions/Exception';
import { ITestFrameworkEvents } from '../../../ObjectModel/TestFramework';

enum JasmineReporterEvent {
    JasmineStarted,
    JasmineDone,
    SuiteStarted,
    SuiteDone,
    SpecStarted,
    SpecDone
}

export class JasmineTestFramework implements ITestFramework {
    public testFrameworkEvents: ITestFrameworkEvents;
    public readonly executorUri: string = 'executor://JasmineTestAdapter/v1';
    public readonly environmentType: EnvironmentType;

    private jasmine: any;
    private source: string;
    private sessionEventArgs: TestSessionEventArgs;
    private suiteStack: Array<TestSuiteEventArgs>;
    private activeSpec: TestCaseEventArgs;
    private testCollection: Map<string, TestCase>;
    private testExecutionCount: Map<string, number>;

    private getJasmine() {
        switch (this.environmentType) {
            case EnvironmentType.NodeJS:
                // tslint:disable-next-line
                return require('jasmine');
            default:
                throw new Exception('Not implemented.', ExceptionType.NotImplementedException);
        }
    }

    constructor(testFrameworkEvents: ITestFrameworkEvents, environmentType: EnvironmentType) {
        this.environmentType = environmentType;
        this.testFrameworkEvents = testFrameworkEvents;
        this.suiteStack = [];
        this.testExecutionCount = new Map();
        
        const jasmineLib = this.getJasmine();
        this.jasmine = new jasmineLib();
        
        // Jasmine forces node to close after completion
        // tslint:disable: no-empty
        this.jasmine.exit = () => {};
        this.jasmine.exitCodeCompletion = () => { };
        // tslint:enable: no-empty

        this.initializeReporter();
    }

    public startExecutionWithSource(source: string): void {
        this.source = source;
        this.jasmine.execute([source]);
    }

    public skip(testCase: TestCase) {
        if (!this.testCollection.has(testCase.Id)) {
            return true;
        } else {
            return false;
        }
    }

    public startExecutionWithTests(source: string, testCollection: Map<string, TestCase>): void {
        this.testCollection = testCollection;

        const execute = this.jasmine.jasmine.Spec.prototype.execute;
        const skip = function(onComplete: any) {
            this.onStart(this);
            this.result.status = 'disabled';
            this.resultCallback(this.result);
            if (onComplete) {
                onComplete();
            }
        };
        const check = () => { 
            if (this.skip(this.activeSpec.TestCase)) {
                return skip;
            } else {
                return execute;
            }
        };

        // tslint:disable-next-line        
        const checkSkip = function (name) {
            return this.skip(new TestCase(this.source, name, this.executorUri));
        }.bind(this);

        // tslint:disable-next-line
        this.jasmine.jasmine.Spec.prototype.execute = function (onComplete: any, args: any, check: any = (name:string) => { 
            if (checkSkip(name)) {
                return skip;
            } else {
                return execute;
            }
        } ) {
            check(this.getFullName()).apply(this, arguments);
        };

        this.startExecutionWithSource(source);
    }

    public startDiscovery(source: string): void {
        // tslint:disable: no-empty
        this.jasmine.jasmine.getEnv().beforeAll = () => {};
        this.jasmine.jasmine.getEnv().afterAll = () => {};
        // tslint:enable: no-emptys
        
        const execute = this.jasmine.jasmine.Spec.prototype.execute;
        this.jasmine.jasmine.Spec.prototype.execute = function (onComplete: any) {

            this.onStart(this);
            this.resultCallback(this.result);
            if (onComplete) {
                onComplete();
            }
        };

        this.source = source;
        this.jasmine.execute([source]);
    }

    private handleJasmineReporterEvents(reporterEvent: JasmineReporterEvent, args: any) {
        switch (reporterEvent) {
            case JasmineReporterEvent.JasmineStarted:
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
            case JasmineReporterEvent.JasmineDone:
                this.sessionEventArgs.EndTime = new Date();
                this.sessionEventArgs.InProgress = false;

                this.testFrameworkEvents.onTestSessionEnd.raise(this, this.sessionEventArgs);
                break;
            case JasmineReporterEvent.SuiteStarted:
                const suiteEventArgs: TestSuiteEventArgs = {
                    Name: args.description,
                    Source: this.source,
                    StartTime: new Date(),
                    InProgress: true,
                    EndTime: undefined
                };

                this.suiteStack.push(suiteEventArgs);

                this.testFrameworkEvents.onTestSuiteStart.raise(this, suiteEventArgs);
                break;

            case JasmineReporterEvent.SuiteDone:
                const suiteEndEventArgs = this.suiteStack.pop();

                suiteEndEventArgs.InProgress = false;
                suiteEndEventArgs.EndTime = new Date();

                this.testFrameworkEvents.onTestSuiteEnd.raise(this, suiteEndEventArgs);
                break;

            case JasmineReporterEvent.SpecStarted:
                let executionCount = 1;

                if (this.testExecutionCount.has(args.fullName)) {
                    executionCount = this.testExecutionCount.get(args.fullName) + 1;
                }
                this.testExecutionCount.set(args.fullName, executionCount);

                const testCase = new TestCase(this.source, args.fullName, this.executorUri);
                this.applyTestCaseFilter(args, testCase);

                testCase.DisplayName = args.description;

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

            case JasmineReporterEvent.SpecDone:
                this.activeSpec.InProgress = false;
                this.activeSpec.EndTime = new Date();

                if (!args.failedExpectations) {
                    args.failedExpectations = [];
                }

                for (let i = 0; i < args.failedExpectations.length; i++) {
                    const expectation = args.failedExpectations[i];

                    const failedExpectation: FailedExpectation = {
                        Message: expectation.message,
                        StackTrace: expectation.stack
                    };
                    this.activeSpec.FailedExpectations.push(failedExpectation);
                }

                this.activeSpec.Outcome = args.failedExpectations.length ? TestOutcome.Failed : TestOutcome.Passed;

                if (args.status === 'disabled') {
                    this.activeSpec.Outcome = TestOutcome.Skipped;
                }

                if (args.status === 'failed') {
                    this.activeSpec.Outcome = TestOutcome.Failed;
                }

                this.testFrameworkEvents.onTestCaseEnd.raise(this, this.activeSpec);
                break;
        }
    }

    private applyTestCaseFilter(args: any, testCase: TestCase) {
        if (this.testCollection) {
            if (!this.testCollection.has(testCase.Id)) {
                // this.jasmine.jasmine.Spec.prototype.execute = this.jasmineSkipExecute;
            } else {
                // this.jasmine.jasmine.Spec.prototype.execute = this.jasmineExecute;
            }
        }
    }
    
    private initializeReporter() {
        this.jasmine.clearReporters();
        this.jasmine.addReporter({
            jasmineStarted: (args) => { this.handleJasmineReporterEvents(JasmineReporterEvent.JasmineStarted, args); },
            jasmineDone: (args) => { this.handleJasmineReporterEvents(JasmineReporterEvent.JasmineDone, args); },
            suiteStarted: (args) => { this.handleJasmineReporterEvents(JasmineReporterEvent.SuiteStarted, args); },
            suiteDone: (args) => { this.handleJasmineReporterEvents(JasmineReporterEvent.SuiteDone, args); },
            specStarted: (args) => { this.handleJasmineReporterEvents(JasmineReporterEvent.SpecStarted, args); },
            specDone: (args) => { this.handleJasmineReporterEvents(JasmineReporterEvent.SpecDone, args); }
        });
    }
}