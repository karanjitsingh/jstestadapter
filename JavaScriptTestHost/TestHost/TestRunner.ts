import TestRunCriteriaWithSources from "../ObjectModel/Payloads/TestRunCriteriaWithSources";
import TestFrameworkProvider, { TestFramework } from "./TestFrameworks/TestFrameworkProvider";
import IEnvironment from "../Environment/IEnvironment";
import TestCase from "../ObjectModel/TestCase";
import TestResult from "../ObjectModel/TestResult";
import ITestFramework from "./TestFrameworks/ITestFramework";
import { TestSessionEventArgs, TestCaseEventArgs, TestSuiteEventArgs } from "./TestFrameworks/TestFrameworkEventArgs";
import { TestExecutionCache } from "./TestExecutionCache";
import TimeSpan from "../Utils/TimeSpan";
import ICommunicationManager from "../Utils/ICommunicationManager";
import MessageType from "../ObjectModel/MessageType";
import { TestRunChangedEventArgs } from "../ObjectModel/Payloads/TestRunChangedEventArgs";
import Message from "../ObjectModel/Message";
import { TestRunCompleteEventArgs } from "../ObjectModel/EventArgs/TestRunCompleteEventArgs";
import { TestRunCompletePayload } from "../ObjectModel/Payloads/TestRunCompletePayload";
import DiscoveryCriteria from "../ObjectModel/Payloads/DiscoveryCriteria";
import Event, { IEventArgs } from "../Events/Event";
import { TestDiscoveryCache } from "./TestDiscoveryCache";
import TestsDiscoveredEventArgs from "../ObjectModel/EventArgs/TestsDiscoveredEventArgs";
import DiscoveryCompletePayload from "../ObjectModel/Payloads/DiscoveryCompletePayload";

export default class TestRunner {

    private readonly environment: IEnvironment;
    private readonly communicationManager: ICommunicationManager;
    private onComplete: Event<IEventArgs>;

    private testExecutionCache: TestExecutionCache;
    private testDiscoveryCache: TestDiscoveryCache;

    constructor(environment: IEnvironment, communicationManager: ICommunicationManager) {
        this.environment = environment;
        this.communicationManager = communicationManager;
        this.onComplete = environment.createEvent();
    }

    public DiscoverTests(criteria: DiscoveryCriteria): Promise<void> {
        let framework = TestFrameworkProvider.GetTestFramework(TestFramework.Jasmine, this.environment);
        let sources = criteria.AdapterSourceMap[Object.keys(criteria.AdapterSourceMap)[0]];

        this.testDiscoveryCache = new TestDiscoveryCache(this.environment, criteria.FrequencyOfDiscoveredTestsEvent, criteria.DiscoveredTestEventTimeout);
        this.testDiscoveryCache.onReportTestCases.subscribe(this.TestCacheEventHandlers.HandleTestDiscoveryStatsChange)

        this.DiscoveryEventHandlers.Subscribe(framework);
        framework.StartDiscovery(sources[0]);

        return new Promise((resolve) => {
            this.onComplete.subscribe((sender:object, args: IEventArgs) => {resolve();});
        });
    }
    
    public StartTestRunWithSources(criteria: TestRunCriteriaWithSources): Promise<void> {
        let framework = TestFrameworkProvider.GetTestFramework(TestFramework.Jasmine, this.environment);
        let sources = criteria.AdapterSourceMap[Object.keys(criteria.AdapterSourceMap)[0]];
        
        this.testExecutionCache = new TestExecutionCache(this.environment, criteria.TestExecutionContext.FrequencyOfRunStatsChangeEvent, criteria.TestExecutionContext.RunStatsChangeEventTimeout)
        this.testExecutionCache.onTestRunStatsChange.subscribe(this.TestCacheEventHandlers.HandleTestRunStatsChange);

        this.ExecutionEventHandlers.Subscribe(framework);
        framework.StartExecution(sources[0]);

        return new Promise((resolve) => {
            this.onComplete.subscribe((sender:object, args: IEventArgs) => {resolve();});
        });
    }

    private ExecutionEventHandlers = {
        Subscribe: (framework: ITestFramework) => {
            // framework.onTestSessionStart.subscribe(this.HandleTestSessionStart);
            framework.onTestSessionEnd.subscribe(this.ExecutionEventHandlers.HandleTestSessionEnd);
            // // framework.onTestSuiteStart.subscribe(this.HandleTestSuiteStart);
            // // framework.onTestSuiteEnd.subscribe(this.HandleTestSuiteEnd);
            framework.onTestCaseStart.subscribe(this.ExecutionEventHandlers.HandleTestCaseStart);
            framework.onTestCaseEnd.subscribe(this.ExecutionEventHandlers.HandleTestCaseEnd);
        },

        HandleTestSessionStart: (sender: object, args: TestSessionEventArgs) => {
        },
    
        HandleTestSessionEnd: (sender: object, args: TestSessionEventArgs) => {
            console.log("test session end trigger");
            let remainingTestResults = this.testExecutionCache.CleanCache();
            
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
    
            this.onComplete.raise(this, null);
        },
    
        HandleTestSuiteStart: (sender: object, args: TestSuiteEventArgs) => {
        },
    
        HandleTestSuiteEnd: (sender: object, args: TestSuiteEventArgs) => {
        },
    
        HandleTestCaseStart: (sender: object, args: TestCaseEventArgs) => {
            console.log("adding test case to cache");
            this.testExecutionCache.AddInProgressTest(args.TestCase);
        },
    
        HandleTestCaseEnd: (sender: object, args: TestCaseEventArgs) => {
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
    
            this.testExecutionCache.AddTestResult(testResult);
        }
    };

    private DiscoveryEventHandlers = {
        Subscribe: (framework: ITestFramework) => {
            // framework.onTestSessionStart.subscribe(this.HandleTestSessionStart);
            framework.onTestSessionEnd.subscribe(this.DiscoveryEventHandlers.HandleTestSessionEnd);
            // // framework.onTestSuiteStart.subscribe(this.HandleTestSuiteStart);
            // // framework.onTestSuiteEnd.subscribe(this.HandleTestSuiteEnd);
            framework.onTestCaseStart.subscribe(this.DiscoveryEventHandlers.HandleTestCaseStart);
            // framework.onTestCaseEnd.subscribe(this.DiscoveryEventHandlers.HandleTestCaseEnd);
        },

        HandleTestSessionStart: (sender: object, args: TestSessionEventArgs) => {
        },
    
        HandleTestSessionEnd: (sender: object, args: TestSessionEventArgs) => {
            console.log("test session end trigger");
            let remainingTests = this.testDiscoveryCache.CleanCache();
            
            var discoveryCompletePayload: DiscoveryCompletePayload = {
                Metrics: {},
                TotalTests: remainingTests.TotalTestsDiscovered,
                LastDiscoveredTests: remainingTests.DiscoveredTests,
                IsAborted: false,
            }
    
            this.communicationManager.SendMessage(new Message(MessageType.DiscoveryComplete, discoveryCompletePayload, 2));
    
            this.onComplete.raise(this, null);
        },
    
        HandleTestSuiteStart: (sender: object, args: TestSuiteEventArgs) => {
        },
    
        HandleTestSuiteEnd: (sender: object, args: TestSuiteEventArgs) => {
        },
    
        HandleTestCaseStart: (sender: object, args: TestCaseEventArgs) => {
            console.log("adding test case to cache");
            this.testDiscoveryCache.AddTest(args.TestCase);
        },
    
        HandleTestCaseEnd: (sender: object, args: TestCaseEventArgs) => {
        }
    };


    private TestCacheEventHandlers = {
        HandleTestRunStatsChange: (sender: object, args: TestRunChangedEventArgs) => {
            console.log("test run stats change");
    
            let testRunChangedMessaged = new Message(MessageType.TestRunStatsChange, args, 2);
            this.communicationManager.SendMessage(testRunChangedMessaged);
        },

        HandleTestDiscoveryStatsChange: (sender: object, args: TestsDiscoveredEventArgs) => {
            console.log("tests discovered");

            let testsFoundMessage = new Message(MessageType.TestCasesFound, args.DiscoveredTests, 2);
            this.communicationManager.SendMessage(testsFoundMessage);
        }
    }
}