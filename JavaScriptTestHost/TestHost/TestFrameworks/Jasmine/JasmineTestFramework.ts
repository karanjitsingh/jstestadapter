import ITestFramework, { TestFrameWorkEventArgs } from "../ITestFramework";
import Event from "../../../Events/Event";
import IEnvironment from "../../../Environment/IEnvironment";
import JasmineReporter, { JasmineReporterEvent } from "./JasmineReporter";

export default class JasmineTestFramework implements ITestFramework {
    public onTestCaseStart: Event<TestFrameWorkEventArgs>;
    public onTestCaseEnd: Event<TestFrameWorkEventArgs>;
    public onTestSuiteStart: Event<TestFrameWorkEventArgs>;
    public onTestSuiteEnd: Event<TestFrameWorkEventArgs>;
    public onTestSessionStart: Event<TestFrameWorkEventArgs>;
    public onTestSessionEnd: Event<TestFrameWorkEventArgs>;
    
    private jasmine;
    private jasmineReporter: JasmineReporter;

    private environment: IEnvironment;

    constructor(environment: IEnvironment) {
        this.environment = environment;

        this.InitializeEvents();
        
        let Jasmine = require('jasmine');
        this.jasmine = new Jasmine();
        
        this.jasmineReporter = new JasmineReporter(this.HandleReporterEvent);
        this.jasmine.clearReporters;
        this.jasmine.addReporter(this.jasmineReporter);
    }
    
    public StartExecution(source: string) {
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

    private InitializeEvents() {
        this.onTestCaseStart = this.environment.createEvent();
        this.onTestCaseEnd = this.environment.createEvent();
        this.onTestSuiteStart = this.environment.createEvent();
        this.onTestSuiteEnd = this.environment.createEvent();
        this.onTestSessionStart = this.environment.createEvent();
        this.onTestSessionEnd = this.environment.createEvent();
    }

    private HandleReporterEvent = (event: JasmineReporterEvent, args) => {
        switch(event) {
            case JasmineReporterEvent.JasmineStarted:
                this.onTestSessionStart.raise(this, null);
                break;

            case JasmineReporterEvent.JasmineDone:
                this.onTestSessionEnd.raise(this, null);
                break;

            case JasmineReporterEvent.SuiteStarted:
                this.onTestSuiteStart.raise(this, null);
                break;
                
            case JasmineReporterEvent.SuiteDone:
                this.onTestSuiteEnd.raise(this, null);
                break;
            
            case JasmineReporterEvent.SpecStarted:
                this.onTestCaseStart.raise(this, null);
                break;
                
            case JasmineReporterEvent.SpecDone:
                this.onTestCaseEnd.raise(this, null);
                break;
        }
    }
}