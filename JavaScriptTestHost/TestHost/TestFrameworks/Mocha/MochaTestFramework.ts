import ITestFramework from "../ITestFramework";
import Event, { IEventArgs } from "../../../Events/Event";
import IEnvironment from "../../../Environment/IEnvironment";
import { TestCaseEventArgs, TestSuiteEventArgs, TestSessionEventArgs, FailedExpectation } from "../TestFrameworkEventArgs";
import TestCase from "../../../ObjectModel/TestCase";
import { TestOutcome } from "../../../ObjectModel/TestOutcome";
import { reporters } from "mocha";


enum ReporterEvent {
    SessionStarted,
    SessionDone,
    SuiteStarted,
    SuiteDone,
    SpecStarted,
    SpecDone
}

export default class MochaTestFramework implements ITestFramework {
    public onTestCaseStart: Event<TestCaseEventArgs>;
    public onTestCaseEnd: Event<TestCaseEventArgs>;
    public onTestSuiteStart: Event<TestSuiteEventArgs>;
    public onTestSuiteEnd: Event<TestSuiteEventArgs>;
    public onTestSessionStart: Event<TestSessionEventArgs>;
    public onTestSessionEnd: Event<TestSessionEventArgs>;
    public readonly ExecutorUri: string = "executor://MochaTestAdapter/v1"

    private MochaLib;
    private mocha: Mocha;
    private mochaRunner;
    private environment: IEnvironment;
    private source;
    private sessionEventArgs: TestSessionEventArgs;
    private suiteStack: Array<TestSuiteEventArgs>;
    private activeSpec: TestCaseEventArgs;

    constructor(environment: IEnvironment) {
        this.environment = environment;
        this.suiteStack = [];

        this.InitializeEvents();

        this.MochaLib = require('mocha');
        this.mocha = new this.MochaLib({
            reporter: 'base'
        });
    }

    public StartExecution(source: string): void {
        this.source = source;
        
        this.mocha.addFile(source);
        this.InitializeReporter(this.mocha.run()); 
    };

    public StartDiscovery(source: string): void {
        this.MochaLib.Suite.prototype.beforeAll = function() {};
        this.MochaLib.Suite.prototype.afterAll = function() {};
        this.MochaLib.Suite.prototype.beforeEach = function() {};
        this.MochaLib.Suite.prototype.afterEach = function() {};
        this.MochaLib.Suite.prototype.it = function() {};
    };

    private HandleReporterEvents(reporterEvent: ReporterEvent, args: any) {
        switch (reporterEvent) {
            case ReporterEvent.SessionStarted:
                this.sessionEventArgs = {
                    Source: this.source,
                    StartTime: new Date(),
                    InProgress: true,
                    EndTime: null
                }

                this.onTestSessionStart.raise(this, this.sessionEventArgs);
                break;

            case ReporterEvent.SessionDone:
                this.sessionEventArgs.EndTime = new Date();
                this.sessionEventArgs.InProgress = false;

                this.onTestSessionEnd.raise(this, this.sessionEventArgs);    
                break;

            case ReporterEvent.SuiteStarted:

                let suiteEventArgs: TestSuiteEventArgs = {
                    Name: args.title,
                    Source: this.source,
                    StartTime: new Date(),
                    InProgress: true,
                    EndTime: undefined
                };

                this.suiteStack.push(suiteEventArgs)

                this.onTestSuiteStart.raise(this, suiteEventArgs)
                break;
            
            case ReporterEvent.SuiteDone:
                if(!this.suiteStack.length)
                    break;

                let suiteEndEventArgs = this.suiteStack.pop();

                suiteEndEventArgs.InProgress = false;
                suiteEndEventArgs.EndTime = new Date();

                this.onTestSuiteEnd.raise(this, suiteEndEventArgs);
                break;

            case ReporterEvent.SpecStarted:

                let testCase = new TestCase(this.source, args.fullTitle(), this.ExecutorUri);
                testCase.DisplayName = args.title;

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
            
            case ReporterEvent.SpecDone:
                this.activeSpec.InProgress = false;
                this.activeSpec.EndTime = new Date();

                if(args.pending === true) {
                    this.activeSpec.Outcome = TestOutcome.Skipped;
                }

                if (args.state === "passed") {
                    this.activeSpec.Outcome = TestOutcome.Passed;
                }
                else if (args.state === "failed") {
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

    private InitializeEvents() {
        this.onTestCaseStart = this.environment.createEvent();
        this.onTestCaseEnd = this.environment.createEvent();
        this.onTestSuiteStart = this.environment.createEvent();
        this.onTestSuiteEnd = this.environment.createEvent();
        this.onTestSessionStart = this.environment.createEvent();
        this.onTestSessionEnd = this.environment.createEvent();
    }

    private InitializeReporter(runner) {
        runner.setMaxListeners(20);

        // A known issue with mocha that start event is called before we can subscribe
        // this.mochaRunner.on('start', (args) => { this.HandleReporterEvents(ReporterEvent.SessionStarted, args); });
        this.HandleReporterEvents(ReporterEvent.SessionStarted, null);

        runner.on('suite', (args) => {
            this.HandleReporterEvents(ReporterEvent.SuiteStarted, args);
        });
        runner.on('suite end', (args) => {
            this.HandleReporterEvents(ReporterEvent.SuiteDone, args);
        });
        runner.on('test', (args) => {
            this.HandleReporterEvents(ReporterEvent.SpecStarted, args);
        });
        runner.on('test end', (args) => {
            this.HandleReporterEvents(ReporterEvent.SpecDone, args);
        });
        runner.on('end', (args) => {
            this.HandleReporterEvents(ReporterEvent.SessionDone, args);
        });
    }
}