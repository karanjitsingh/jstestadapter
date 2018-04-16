import ITestFramework from "../ITestFramework";
import Event, { IEventArgs } from "../../../Events/Event";
import IEnvironment from "../../../Environment/IEnvironment";
import { TestCaseEventArgs, TestSuiteEventArgs, TestSessionEventArgs, FailedExpectation } from "../TestFrameworkEventArgs";
import TestCase from "../../../ObjectModel/TestCase";
import { TestOutcome } from "../../../ObjectModel/TestOutcome";

enum JasmineReporterEvent {
    JasmineStarted,
    JasmineDone,
    SuiteStarted,
    SuiteDone,
    SpecStarted,
    SpecDone
}

export default class JasmineTestFramework implements ITestFramework {
    public onTestCaseStart: Event<TestCaseEventArgs>;
    public onTestCaseEnd: Event<TestCaseEventArgs>;
    public onTestSuiteStart: Event<TestSuiteEventArgs>;
    public onTestSuiteEnd: Event<TestSuiteEventArgs>;
    public onTestSessionStart: Event<TestSessionEventArgs>;
    public onTestSessionEnd: Event<TestSessionEventArgs>;
    public readonly ExecutorUri: string = "executor://JasmineTestAdapter/v1"

    private jasmine;
    private environment: IEnvironment;
    private source;
    private sessionEventArgs: TestSessionEventArgs;
    private suiteStack: Array<TestSuiteEventArgs>;
    private activeSpec: TestCaseEventArgs;

    constructor(environment: IEnvironment) {
        this.environment = environment;
        this.suiteStack = [];

        let Jasmine = require('jasmine');
        this.jasmine = new Jasmine();
        this.jasmine.exit = () => {};
        this.jasmine.exitCodeCompletion = () => {};
        
        this.InitializeEvents();
        this.InitializeReporter();
    }

    public StartExecution(source: string): void {
        this.source = source;
        this.jasmine.execute([source]);
    };

    public StartDiscovery(source: string): void {
        this.jasmine.jasmine.getEnv().beforeAll = function () { };
        this.jasmine.jasmine.getEnv().afterAll = function () { };
        this.jasmine.jasmine.Spec.prototype.execute = function (onComplete) {

            this.onStart(this);
            this.resultCallback(this.result);
            if (onComplete)
                onComplete();
        };

        this.source = source;
        this.jasmine.execute([source]);
    };

    private HandleJasmineReporterEvents(reporterEvent: JasmineReporterEvent, args: any) {
        switch (reporterEvent) {
            case JasmineReporterEvent.JasmineStarted:
                this.sessionEventArgs = {
                    Source: this.source,
                    StartTime: new Date(),
                    InProgress: true,
                    EndTime: null
                }

                this.onTestSessionStart.raise(this, this.sessionEventArgs);
                break;

            case JasmineReporterEvent.JasmineDone:
                this.sessionEventArgs.EndTime = new Date();
                this.sessionEventArgs.InProgress = false;

                this.onTestSessionEnd.raise(this, this.sessionEventArgs);    
                break;

            case JasmineReporterEvent.SuiteStarted:

                let suiteEventArgs: TestSuiteEventArgs = {
                    Name: args.description,
                    Source: this.source,
                    StartTime: new Date(),
                    InProgress: true,
                    EndTime: undefined
                };

                this.suiteStack.push(suiteEventArgs)

                this.onTestSuiteStart.raise(this, suiteEventArgs)
                break;
            
            case JasmineReporterEvent.SuiteDone:
                let suiteEndEventArgs = this.suiteStack.pop();

                suiteEndEventArgs.InProgress = false;
                suiteEndEventArgs.EndTime = new Date();

                this.onTestSuiteEnd.raise(this, args);
                break;

            case JasmineReporterEvent.SpecStarted:

                // TODO null problems will occur here
                // let currentSuiteName = this.suiteStack.length > 0
                // ? this.suiteStack[this.suiteStack.length - 1].fullName
                // : null;
                // let suiteName = currentSuiteName;

                let testCase = new TestCase(this.source, args.fullName, this.ExecutorUri);
                testCase.DisplayName = args.description;

                this.activeSpec = <TestCaseEventArgs> {
                    TestCase: testCase,
                    FailedExpectations: [],
                    Outcome: TestOutcome.None,
                    Source: this.source,
                    StartTime: new Date(),
                    InProgress: true,
                    EndTime: null
                }

                this.onTestCaseStart.raise(this, this.activeSpec);
                break;
            
            case JasmineReporterEvent.SpecDone:
                this.activeSpec.InProgress = false;
                this.activeSpec.EndTime = new Date();
    
                for (let i = 0; i < args.failedExpectations.length; i++) {
                    let expectation = args.failedExpectations[i];
        
                    let failedExpectation: FailedExpectation = {
                        Message: expectation.message,
                        StackTrace: this.recordStackTrace(expectation.stack)
                    }
                    this.activeSpec.FailedExpectations.push(failedExpectation);        
                }

                if (args.status === "disabled") {
                    this.activeSpec.Outcome = TestOutcome.Skipped;
                }
        
                if (args.status === "failed") {
                    this.activeSpec.Outcome = TestOutcome.Failed;
                }

                this.activeSpec.Outcome = args.failedExpectations.length ? TestOutcome.Failed : TestOutcome.Passed;

                this.onTestCaseEnd.raise(this, this.activeSpec);
                break;
        }
    }

    private InitializeEvents() {
        this.onTestCaseStart = this.environment.createEvent();
        this.onTestCaseEnd = this.environment.createEvent();
        this.onTestSuiteStart = this.environment.createEvent();
        this.onTestSuiteEnd = this.environment.createEvent();
        this.onTestSessionStart = this.environment.createEvent();
        this.onTestSessionEnd = this.environment.createEvent();
    }

    private InitializeReporter() {
        this.jasmine.clearReporters();
        this.jasmine.addReporter({
            jasmineStarted: (args) => { this.HandleJasmineReporterEvents(JasmineReporterEvent.JasmineStarted, args) },
            jasmineDone: (args) => { this.HandleJasmineReporterEvents(JasmineReporterEvent.JasmineDone, args) },
            suiteStarted: (args) => { this.HandleJasmineReporterEvents(JasmineReporterEvent.SuiteStarted, args) },
            suiteDone: (args) => { this.HandleJasmineReporterEvents(JasmineReporterEvent.SuiteDone, args) },
            specStarted: (args) => { this.HandleJasmineReporterEvents(JasmineReporterEvent.SpecStarted, args) },
            specDone: (args) => { this.HandleJasmineReporterEvents(JasmineReporterEvent.SpecDone, args) },
        });
    }

    private recordStackTrace(stack) {
        if (stack) {
            // Truncate stack to 5 deep. 
            stack = stack.split('\n').slice(1, 6).join('\n');
        }
        return stack;
    }
}