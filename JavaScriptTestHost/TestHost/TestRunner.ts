import TestRunCriteriaWithSources from "../ObjectModel/TestRunCriteriaWithSources";
import TestFrameworkProvider, { TestFramework } from "./TestFrameworks/TestFrameworkProvider";
import IEnvironment from "../Environment/IEnvironment";
import TestCase from "../ObjectModel/TestCase";
import TestResult from "../ObjectModel/TestResult";

export default class TestRunner {

    private environment: IEnvironment;
    private inProgressTests: Array<TestCase>;
    private CompletedTests: Array<TestResult>;
    private NewTestResults: Array<TestResult>;

    constructor(environment: IEnvironment) {
        this.environment = environment;

        this.inProgressTests = [];
        this.CompletedTests = [];
        this.NewTestResults = [];
    }

    public DiscoverTests(): Array<TestCase> {

        return;
    }
    
    public StartTestRunWithSources(criteria: TestRunCriteriaWithSources): void {
        console.log("test runner here: ", criteria);
        
        let framework = TestFrameworkProvider.GetTestFramework(TestFramework.Jasmine, this.environment);

        var sources = criteria.AdapterSourceMap[Object.keys(criteria.AdapterSourceMap)[0]];
        
        
        
        
        framework.StartExecution(sources[0]);

    }

    private onTestSessionStart() {

    }

    private onTestSessionEnd() {
        
    }

    private onTestSuiteStart() {

    }

    private onTestSuiteEnd() {

    }

    private onTestCaseStart() {

    }

    private onTestCaseEnd() {

    }
}