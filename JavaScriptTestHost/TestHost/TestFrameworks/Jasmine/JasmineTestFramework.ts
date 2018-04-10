import ITestFramework, { TestFrameWorkEventArgs } from "../ITestFramework";
import Event from "../../../Events/Event";
import IEnvironment from "../../../Environment/IEnvironment";
import JasmineReporter, { JasmineReporterEvent } from "./JasmineReporter";

export default class JasmineTestFramework implements ITestFramework {
    public onTestCaseStart: Event<TestFrameWorkEventArgs>;
    public onTestCaseEnd: Event<TestFrameWorkEventArgs>;
    public onTestSessionStart: Event<TestFrameWorkEventArgs>;
    public onTestSessionEnd: Event<TestFrameWorkEventArgs>;
    public onFileStart: Event<TestFrameWorkEventArgs>;
    public onFileEnd: Event<TestFrameWorkEventArgs>;
    
    private jasmine;
    private jasmineReporter: JasmineReporter;

    constructor(env: IEnvironment) {
        this.jasmineReporter = new JasmineReporter(this.HandleReporterEvent);
        this.InitializeJasmine();
    }

    private InitializeJasmine() {
        let Jasmine = require('jasmine');
        this.jasmine = new Jasmine();
        this.jasmine.clearReporters;
        this.jasmine.addReporter(this.jasmineReporter);
    }
    
    public StartExecution(sources: Array<string>) {
        this.jasmine.execute(sources);
    };
    
    public StartDiscovery(sources: Array<string>) {
        this.jasmine.jasmine.getEnv().beforeAll = function () { };
        this.jasmine.jasmine.getEnv().afterAll = function () { };
        this.jasmine.jasmine.Spec.prototype.execute = function (onComplete) {
    
            this.onStart(this);
            this.resultCallback(this.result);
            if (onComplete)
                onComplete();
        };
    };

    private HandleReporterEvent = (event: JasmineReporterEvent, args) => {
        switch(event) {
            case JasmineReporterEvent.JasmineStarted:
                this.onFileStart.raise(this, null);
                break;
        }
    }
}