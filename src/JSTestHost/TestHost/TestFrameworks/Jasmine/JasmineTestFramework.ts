import { ITestFramework } from '../ITestFramework';
import { Event, IEventArgs } from '../../../Events/Event';
import { IEnvironment, EnvironmentType } from '../../../Environment/IEnvironment';
import { TestCaseEventArgs, TestSuiteEventArgs, TestSessionEventArgs, FailedExpectation } from '../TestFrameworkEventArgs';
import { TestCase } from '../../../ObjectModel/TestCase';
import { TestOutcome } from '../../../ObjectModel/TestOutcome';
import { Exception, ExceptionType } from '../../../Exceptions/Exception';

enum JasmineReporterEvent {
    JasmineStarted,
    JasmineDone,
    SuiteStarted,
    SuiteDone,
    SpecStarted,
    SpecDone
}

export class JasmineTestFramework implements ITestFramework {
    public onTestCaseStart: Event<TestCaseEventArgs>;
    public onTestCaseEnd: Event<TestCaseEventArgs>;
    public onTestSuiteStart: Event<TestSuiteEventArgs>;
    public onTestSuiteEnd: Event<TestSuiteEventArgs>;
    public onTestSessionStart: Event<TestSessionEventArgs>;
    public onTestSessionEnd: Event<TestSessionEventArgs>;
    public readonly executorUri: string = 'executor://JasmineTestAdapter/v1';

    private jasmine: any;
    private environment: IEnvironment;
    private source: string;
    private sessionEventArgs: TestSessionEventArgs;
    private suiteStack: Array<TestSuiteEventArgs>;
    private activeSpec: TestCaseEventArgs;

    private getJasmine() {
        switch (this.environment.environmentType) {
            case EnvironmentType.NodeJS:
                // tslint:disable-next-line
                return require('jasmine');
            default:
                throw new Exception('Not implemented.', ExceptionType.NotImplementedException);
        }
    }

    constructor(environment: IEnvironment) {
        this.environment = environment;
        this.suiteStack = [];

        const jasmineLib = this.getJasmine();
        this.jasmine = new jasmineLib();

        // tslint:disable: no-empty
        this.jasmine.exit = () => {};
        this.jasmine.exitCodeCompletion = () => { };
        // tslint:enable: no-empty

        this.initializeEvents();
        this.initializeReporter();
    }

    public startExecution(source: string): void {
        this.source = source;
        this.jasmine.execute([source]);
    }

    public startDiscovery(source: string): void {
        // tslint:disable: no-empty
        this.jasmine.jasmine.getEnv().beforeAll = () => {};
        this.jasmine.jasmine.getEnv().afterAll = () => {};
        // tslint:enable: no-emptys
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

                this.onTestSessionStart.raise(this, this.sessionEventArgs);
                break;

            case JasmineReporterEvent.JasmineDone:
                this.sessionEventArgs.EndTime = new Date();
                this.sessionEventArgs.InProgress = false;

                this.onTestSessionEnd.raise(this, this.sessionEventArgs);
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

                this.onTestSuiteStart.raise(this, suiteEventArgs);
                break;

            case JasmineReporterEvent.SuiteDone:
                const suiteEndEventArgs = this.suiteStack.pop();

                suiteEndEventArgs.InProgress = false;
                suiteEndEventArgs.EndTime = new Date();

                this.onTestSuiteEnd.raise(this, suiteEndEventArgs);
                break;

            case JasmineReporterEvent.SpecStarted:

                // TODO null problems will occur here
                // let currentSuiteName = this.suiteStack.length > 0
                // ? this.suiteStack[this.suiteStack.length - 1].fullName
                // : null;
                // let suiteName = currentSuiteName;

                const testCase = new TestCase(this.source, args.fullName, this.executorUri);
                testCase.displayName = args.description;

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

            case JasmineReporterEvent.SpecDone:
                this.activeSpec.InProgress = false;
                this.activeSpec.EndTime = new Date();

                for (let i = 0; i < args.failedExpectations.length; i++) {
                    const expectation = args.failedExpectations[i];

                    const failedExpectation: FailedExpectation = {
                        Message: expectation.message,
                        StackTrace: this.recordStackTrace(expectation.stack)
                    };
                    this.activeSpec.FailedExpectations.push(failedExpectation);
                }

                if (args.status === 'disabled') {
                    this.activeSpec.Outcome = TestOutcome.Skipped;
                }

                if (args.status === 'failed') {
                    this.activeSpec.Outcome = TestOutcome.Failed;
                }

                this.activeSpec.Outcome = args.failedExpectations.length ? TestOutcome.Failed : TestOutcome.Passed;

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

    private recordStackTrace(stack: any) {
        if (stack) {
            // Truncate stack to 5 deep.
            stack = stack.split('\n').slice(1, 6).join('\n');
        }
        return stack;
    }
}