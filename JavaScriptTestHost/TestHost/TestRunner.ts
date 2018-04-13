import TestRunCriteriaWithSources from "../ObjectModel/TestRunCriteriaWithSources";
import TestFrameworkProvider, { TestFramework } from "./TestFrameworks/TestFrameworkProvider";
import IEnvironment from "../Environment/IEnvironment";
import TestCase from "../ObjectModel/TestCase";
import TestResult from "../ObjectModel/TestResult";
import ITestFramework from "./TestFrameworks/ITestFramework";
import { TestSessionEventArgs, TestCaseEventArgs, TestSuiteEventArgs } from "./TestFrameworks/TestFrameworkEventArgs";
import { TestCache } from "./TestCache";
import TimeSpan from "../Utils/TimeSpan";
import ICommunicationManager from "../Utils/ICommunicationManager";
import MessageType from "../ObjectModel/MessageType";
import { TestRunChangedEventArgs } from "../ObjectModel/TestRunChangedEventArgs";
import Message from "../ObjectModel/Message";
import { debug } from "util";
import { TestRunCompleteEventArgs } from "ObjectModel/TestRunCompleteEventArgs";
import { TestRunCompletePayload } from "ObjectModel/TestRunCompletePayload";

export default class TestRunner {

    private readonly environment: IEnvironment;
    private readonly communicationManager: ICommunicationManager;
    
    private testCache: TestCache;

    constructor(environment: IEnvironment, communicationManager: ICommunicationManager) {
        this.environment = environment;
        this.communicationManager = communicationManager;
    }

    public DiscoverTests(): Array<TestCase> {

        return [];
    }
    
    public StartTestRunWithSources(criteria: TestRunCriteriaWithSources): void {
        let framework = TestFrameworkProvider.GetTestFramework(TestFramework.Jasmine, this.environment);
        let sources = criteria.AdapterSourceMap[Object.keys(criteria.AdapterSourceMap)[0]];
        
        this.testCache = new TestCache(this.environment, criteria.TestExecutionContext.FrequencyOfRunStatsChangeEvent, criteria.TestExecutionContext.RunStatsChangeEventTimeout)
        this.testCache.onTestRunStatsChange.subscribe(this.HandleTestRunStatsChange);

        this.SubscribeToFrameworkEvents(framework);
        framework.StartExecution(sources[0]);
    }

    public SubscribeToFrameworkEvents(framework: ITestFramework) {
        // framework.onTestSessionStart.subscribe(this.HandleTestSessionStart);
        framework.onTestSessionEnd.subscribe(this.HandleTestSessionEnd);
        // // framework.onTestSuiteStart.subscribe(this.HandleTestSuiteStart);
        // // framework.onTestSuiteEnd.subscribe(this.HandleTestSuiteEnd);
        framework.onTestCaseStart.subscribe(this.HandleTestCaseStart);
        framework.onTestCaseEnd.subscribe(this.HandleTestCaseEnd);
    }

    private HandleTestSessionStart = (sender: object, args: TestSessionEventArgs) => {
    };

    private HandleTestSessionEnd = (sender: object, args: TestSessionEventArgs) => {
        console.log("test session end trigger");
        let remainingTestResults = this.testCache.CleanCache();
        
        var testRunCompleteEventArgs = <TestRunCompleteEventArgs> {
            TestRunStatistics:remainingTestResults.TestRunStatistics,
            IsCanceled: false,
            IsAborted: false,
            Error: null,
            AttachmentSets: [],
            ElapsedTimeInRunningTests: TimeSpan.MSToString(args.EndTime.getTime() - args.StartTime.getTime()),
            Metrics: {}
        }

        // TODO hardcoded executor uris
        var testRuncompletePayload = <TestRunCompletePayload> {
            TestRunCompleteArgs: testRunCompleteEventArgs,
            LastRunTests: remainingTestResults,
            RunAttachments: [],
            ExecutorUris: ["executor://JasmineTestAdapter/v1"]
        }

        this.communicationManager.SendMessage(new Message(MessageType.ExecutionComplete, testRuncompletePayload, 2));
    };

    private HandleTestSuiteStart = (sender: object, args: TestSuiteEventArgs) => {
    };

    private HandleTestSuiteEnd = (sender: object, args: TestSuiteEventArgs) => {
    };

    private HandleTestCaseStart = (sender: object, args: TestCaseEventArgs) => {
        console.log("adding test case to cache");
        this.testCache.AddInProgressTest(args.TestCase);
    };

    private HandleTestCaseEnd = (sender: object, args: TestCaseEventArgs) => {
        console.log("adding test result to cache");
        
        // TODO incomplete test results - display name etc are null

        let testResult: TestResult = {
            TestCase: args.TestCase,
            Attachments: [],
            Outcome: args.Outcome,
            ErrorMessage: null,
            ErrorStackTrace: null,
            DisplayName: null,
            Messages: [],
            ComputerName: null,
            Duration: TimeSpan.MSToString(args.EndTime.getTime() - args.StartTime.getTime()),
            StartTime: args.StartTime,
            EndTime: args.EndTime
        }

        if(args.FailedExpectations.length > 0) {
            testResult.ErrorMessage = args.FailedExpectations[0].Message;
            testResult.ErrorStackTrace = args.FailedExpectations[0]. StackTrace;
        }

        this.testCache.AddTestResult(testResult);
    };

    private HandleTestRunStatsChange = (sender: object, args: TestRunChangedEventArgs) => {
        console.log("test run stats change");

        let testRunChangedMessaged = new Message(MessageType.TestRunStatsChange, args, 2);
        this.communicationManager.SendMessage(testRunChangedMessaged);
    };
}