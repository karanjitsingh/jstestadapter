import TestRunCriteriaWithSources from "../ObjectModel/TestRunCriteriaWithSources";
import TestFrameworkProvider, { TestFramework } from "./TestFrameworks/TestFrameworkProvider";
import IEnvironment from "../Environment/IEnvironment";
import TestCase from "../ObjectModel/TestCase";
import TestResult from "../ObjectModel/TestResult";
import ITestFramework from "./TestFrameworks/ITestFramework";
import { TestSessionEventArgs, TestCaseEventArgs, TestSuiteEventArgs } from "./TestFrameworks/TestFrameworkEventArgs";
import { TestCache, TestRunStatsChangeEventArgs } from "./TestCache";

export default class TestRunner {

    private environment: IEnvironment;
    private testCache: TestCache;

    constructor(environment: IEnvironment) {
        this.environment = environment;
    }

    public DiscoverTests(): Array<TestCase> {

        return [];
    }
    
    public StartTestRunWithSources(criteria: TestRunCriteriaWithSources): void {
        console.log("test runner here: ", criteria);
        
        let framework = TestFrameworkProvider.GetTestFramework(TestFramework.Jasmine, this.environment);
        let sources = criteria.AdapterSourceMap[Object.keys(criteria.AdapterSourceMap)[0]];
        
        this.testCache = new TestCache(this.environment, criteria.TestExecutionContext.FrequencyOfRunStatsChangeEvent, criteria.TestExecutionContext.RunStatsChangeEventTimeout)
        this.testCache.onTestRunStatsChange.subscribe(this.HandleTestRunStatsChange);

        this.SubscribeToFrameworkEvents(framework);
        framework.StartExecution(sources[0]).then(() => {

        },
        (err) => {
           console.error(err); 
        });
    }

    public SubscribeToFrameworkEvents(framework: ITestFramework) {
        // framework.onTestSessionStart.subscribe(this.HandleTestSessionStart);
        framework.onTestSessionEnd.subscribe(this.HandleTestSessionEnd);
        // // framework.onTestSuiteStart.subscribe(this.HandleTestSuiteStart);
        // // framework.onTestSuiteEnd.subscribe(this.HandleTestSuiteEnd);
        framework.onTestCaseStart.subscribe(this.HandleTestCaseStart);
        framework.onTestCaseEnd.subscribe(this.HandleTestCaseEnd);
    }

    private HandleTestSessionStart(sender: object, args: TestSessionEventArgs) {
        console.log(args);
    }

    private HandleTestSessionEnd(sender: object, args: TestSessionEventArgs) {
        console.log("test session end trigger");
        this.testCache.CleanCache();
    }

    private HandleTestSuiteStart(sender: object, args: TestSuiteEventArgs) {
        console.log(args);
    }

    private HandleTestSuiteEnd(sender: object, args: TestSuiteEventArgs) {
        console.log(args);
    }

    private HandleTestCaseStart(sender: object, args: TestCaseEventArgs) {
        console.log("adding test case to cache");
        this.testCache.AddInProgressTest(args.TestCase);
    }

    private HandleTestCaseEnd(sender: object, args: TestCaseEventArgs) {
        console.log("adding test result to cache");
        
        let testResult: TestResult = {
            TestCase: args.TestCase,
            Attachments: [],
            Outcome
        }
    }

    private HandleTestRunStatsChange(sender: object, args: TestRunStatsChangeEventArgs) {
        console.log(args);
    }
}