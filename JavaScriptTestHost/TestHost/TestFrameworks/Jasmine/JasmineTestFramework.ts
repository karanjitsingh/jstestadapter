import ITestFramework from "../ITestFramework";
import Event, { IEventArgs } from "../../../Events/Event";
import IEnvironment from "../../../Environment/IEnvironment";
import { TestCaseEventArgs, TestSuiteEventArgs, TestSessionEventArgs } from "../TestFrameworkEventArgs";
import TestCase from "ObjectModel/TestCase";

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

    private jasmine;
    private environment: IEnvironment;
    private source;
    private sessionEventArgs: TestSessionEventArgs;
    private suiteStack: Array<TestSuiteEventArgs>;
    private activeSpec: TestCaseEventArgs;

    constructor(environment: IEnvironment) {
        this.environment = environment;

        this.InitializeEvents();
        this.InitializeReporter();

        let Jasmine = require('jasmine');
        this.jasmine = new Jasmine();
    }

    public StartExecution(source: string) {
        this.source = source;
        this.jasmine.execute([source]);
    };

    public StartDiscovery(source: string) {
        this.jasmine.jasmine.getEnv().beforeAll = function () { };
        this.jasmine.jasmine.getEnv().afterAll = function () { };
        this.jasmine.jasmine.Spec.prototype.execute = function (onComplete) {

            this.onStart(this);
            this.resultCallback(this.result);
            if (onComplete)
                onComplete();
        };
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

                this.onTestSessionStart.raise(this, this.sessionEventArgs);    
                break;

            case JasmineReporterEvent.SuiteStarted:

                let suiteEventArgs: TestSuiteEventArgs = {
                    Name: args.description,
                    Source: this.source,
                    StartTime: new Date(),
                    InProgress: true,
                    EndTime: null
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

                let currentSuiteName = this.suites.length > 0
                ? this.suites[this.suites.length - 1].fullName
                : null;

    this.testStartTime = new Date().getTime();
    let suiteName = currentSuiteName;
    let specName = result.description;
    let newTestCase = { moduleName: suiteName, testName: specName, testResults: [] };
    this.activeTestCase = newTestCase;
    console.log({ type: "TestStart", testCase: this.activeTestCase });

    this.reporterEventCallback(JasmineReporterEvent.SpecStarted, null);

                break;
            
            case JasmineReporterEvent.SpecDone:
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
}