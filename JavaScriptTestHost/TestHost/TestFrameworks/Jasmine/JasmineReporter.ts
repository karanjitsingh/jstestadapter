export enum JasmineReporterEvent {
    JasmineStarted,
    JasmineDone,
    SuiteStarted,
    SuiteDone,
    SpecStarted,
    SpecDone
}

interface JasmineTestResult {
    passed,
    message,
    stackTrace
}

export default class JasmineReporter {

    private suites = [];
    private fileStartTime: number;
    private testStartTime: number;
    private activeTestCase;
    private reporterEventCallback: (event: JasmineReporterEvent, args) => void;
    private passedCount: number = 0;
    private skippedCount: number = 0;
    private failedCount: number = 0;

    constructor(reporterEventCallback: (event: JasmineReporterEvent, args) => void) {
        this.reporterEventCallback =  reporterEventCallback
                                        ? reporterEventCallback
                                        : (event: JasmineReporterEvent, args) => {};
    }

    public jasmineStarted() {
        this.fileStartTime = new Date().getTime();
        this.reporterEventCallback(JasmineReporterEvent.JasmineStarted, null);
    }
    
    public jasmineDone() {
        let timetaken = new Date().getTime() - this.fileStartTime;
        this.reporterEventCallback(JasmineReporterEvent.JasmineDone, null);
    }

    public suiteStarted(result) {
        this.suites.push(result);
        this.reporterEventCallback(JasmineReporterEvent.SuiteStarted, null);        
    }

    public suiteDone(result) {
        this.suites.pop();
        this.reporterEventCallback(JasmineReporterEvent.SuiteDone, null);        
    }

    public specStarted(result) {
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
        
    }

    public specDone(result) {
        if (result.status === "disabled") {
            return;
        }

        if (result.status === "failed") {
            this.failedCount++;
        }
        else if (result.status === "pending") {
            this.skippedCount++;
            this.activeTestCase.skipped = true;
        }
        else {
            this.passedCount++;
        }

        let timetaken = new Date().getTime() - this.testStartTime;
        this.activeTestCase.timetaken = timetaken;



        for (let i = 0; i < result.failedExpectations.length; i++) {
            let expectation = result.failedExpectations[i];

            let testResult = <JasmineTestResult> {};
            testResult.passed = false;
            testResult.message = expectation.message;
            testResult.stackTrace = this.recordStackTrace(expectation.stack);
            this.activeTestCase.testResults.push(testResult);

        }

        // Log test case when done. This will get picked up by phantom and streamed to chutzpah.
        console.log({ type: "TestDone", testCase: this.activeTestCase });

        this.reporterEventCallback(JasmineReporterEvent.SpecDone, null);
    }

    private recordStackTrace(stack) {
        if (stack) {
            // Truncate stack to 5 deep. 
            stack = stack.split('\n').slice(1, 6).join('\n');
        }
        return stack;
    }
}