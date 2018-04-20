import { TestRunCriteriaWithSources } from '../ObjectModel/Payloads/TestRunCriteriaWithSources';
import { TestFrameworkProvider, TestFramework } from './TestFrameworks/TestFrameworkProvider';
import { IEnvironment } from '../Environment/IEnvironment';
import { TestCase } from '../ObjectModel/TestCase';
import { TestResult } from '../ObjectModel/TestResult';
import { ITestFramework } from './TestFrameworks/ITestFramework';
import { TestSessionEventArgs, TestCaseEventArgs, TestSuiteEventArgs } from './TestFrameworks/TestFrameworkEventArgs';
import { TestExecutionCache } from './TestExecutionCache';
import { TimeSpan } from '../Utils/TimeSpan';
import { ICommunicationManager } from '../Environment/ICommunicationManager';
import { MessageType } from '../ObjectModel/MessageType';
import { TestRunChangedEventArgs } from '../ObjectModel/Payloads/TestRunChangedEventArgs';
import { Message } from '../ObjectModel/Message';
import { TestRunCompleteEventArgs } from '../ObjectModel/EventArgs/TestRunCompleteEventArgs';
import { TestRunCompletePayload } from '../ObjectModel/Payloads/TestRunCompletePayload';
import { DiscoveryCriteria } from '../ObjectModel/Payloads/DiscoveryCriteria';
import { Event, IEventArgs } from '../Events/Event';
import { TestDiscoveryCache } from './TestDiscoveryCache';
import { TestsDiscoveredEventArgs } from '../ObjectModel/EventArgs/TestsDiscoveredEventArgs';
import { DiscoveryCompletePayload } from '../ObjectModel/Payloads/DiscoveryCompletePayload';

interface FrameworkEventHandlers {
    Subscribe: (framework: ITestFramework) => void;
    TestSessionStart: (sender: object, args: TestSessionEventArgs) => void;
    TestSessionEnd: (sender: object, args: TestSessionEventArgs) => void;
    TestSuiteStart: (sender: object, args: TestSuiteEventArgs) => void;
    TestSuiteEnd: (sender: object, args: TestSuiteEventArgs) => void;
    TestCaseStart: (sender: object, args: TestCaseEventArgs) => void;
    TestCaseEnd: (sender: object, args: TestCaseEventArgs) => void;
}

export class TestRunner {

    private readonly environment: IEnvironment;
    private readonly communicationManager: ICommunicationManager;
    private onComplete: Event<IEventArgs>;
    private testExecutionCache: TestExecutionCache;
    private testDiscoveryCache: TestDiscoveryCache;
    private runner: TestFramework = TestFramework.Mocha;

    constructor(environment: IEnvironment, communicationManager: ICommunicationManager) {
        this.environment = environment;
        this.communicationManager = communicationManager;
        this.onComplete = environment.createEvent();
    }

    public discoverTests(criteria: DiscoveryCriteria): Promise<void> {
        const framework = TestFrameworkProvider.getTestFramework(this.runner, this.environment);
        const sources = criteria.AdapterSourceMap[Object.keys(criteria.AdapterSourceMap)[0]];

        this.testDiscoveryCache = new TestDiscoveryCache(this.environment,
                                                         criteria.FrequencyOfDiscoveredTestsEvent,
                                                         criteria.DiscoveredTestEventTimeout);

        this.testDiscoveryCache.onReportTestCases.subscribe(this.testDiscoveryStatsChange);

        this.discoveryEventHandlers.Subscribe(framework);
        framework.startDiscovery(sources[0]);

        return new Promise((resolve) => {
            this.onComplete.subscribe((sender: object, args: IEventArgs) => { resolve(); });
        });
    }

    public startTestRunWithSources(criteria: TestRunCriteriaWithSources): Promise<void> {
        const framework = TestFrameworkProvider.getTestFramework(this.runner, this.environment);
        const sources = criteria.AdapterSourceMap[Object.keys(criteria.AdapterSourceMap)[0]];

        this.testExecutionCache = new TestExecutionCache(this.environment,
                                                         criteria.TestExecutionContext.FrequencyOfRunStatsChangeEvent,
                                                         criteria.TestExecutionContext.RunStatsChangeEventTimeout);

        this.testExecutionCache.onTestRunStatsChange.subscribe(this.testRunStatsChange);

        this.executionEventHandlers.Subscribe(framework);
        framework.startExecution(sources[0]);

        return new Promise((resolve) => {
            this.onComplete.subscribe((sender: object, args: IEventArgs) => { resolve(); });
        });
    }

    private executionEventHandlers: FrameworkEventHandlers = {
        Subscribe: (framework: ITestFramework) => {
            // framework.onTestSessionStart.subscribe(this.executionEventHandlers.TestSessionStart);
            framework.onTestSessionEnd.subscribe(this.executionEventHandlers.TestSessionEnd);
            // framework.onTestSuiteStart.subscribe(this.executionEventHandlers.TestSuiteStart);
            // framework.onTestSuiteEnd.subscribe(this.executionEventHandlers.TestSuiteEnd);
            framework.onTestCaseStart.subscribe(this.executionEventHandlers.TestCaseStart);
            framework.onTestCaseEnd.subscribe(this.executionEventHandlers.TestCaseEnd);
        },

        TestSessionStart: (sender: object, args: TestSessionEventArgs) => {
            return;
        },

        TestSessionEnd: (sender: object, args: TestSessionEventArgs) => {
            console.log('test session end trigger');
            const remainingTestResults = this.testExecutionCache.cleanCache();

            const testRunCompleteEventArgs = <TestRunCompleteEventArgs> {
                TestRunStatistics: remainingTestResults.TestRunStatistics,
                IsCanceled: false,
                IsAborted: false,
                Error: null,
                AttachmentSets: [],
                ElapsedTimeInRunningTests: TimeSpan.MSToString(args.EndTime.getTime() - args.StartTime.getTime()),
                Metrics: {}
            };

            // TODO hardcoded executor uris
            const testRuncompletePayload = <TestRunCompletePayload> {
                TestRunCompleteArgs: testRunCompleteEventArgs,
                LastRunTests: remainingTestResults,
                RunAttachments: [],
                ExecutorUris: ['executor: //JasmineTestAdapter/v1']
            };

            this.communicationManager.sendMessage(new Message(MessageType.ExecutionComplete, testRuncompletePayload, 2));

            this.onComplete.raise(this, null);
        },

        TestSuiteStart: (sender: object, args: TestSuiteEventArgs) => {
            return;
        },

        TestSuiteEnd: (sender: object, args: TestSuiteEventArgs) => {
            return;
        },

        TestCaseStart: (sender: object, args: TestCaseEventArgs) => {
            console.log('adding test case to cache');
            this.testExecutionCache.addInProgressTest(args.TestCase);
        },

        TestCaseEnd: (sender: object, args: TestCaseEventArgs) => {
            console.log('adding test result to cache');

            // TODO incomplete test results - display name etc are null

            const testResult: TestResult = {
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
            };

            if (args.FailedExpectations.length > 0) {
                testResult.ErrorMessage = args.FailedExpectations[0].Message;
                testResult.ErrorStackTrace = args.FailedExpectations[0]. StackTrace;
            }

            this.testExecutionCache.addTestResult(testResult);
        }
    };

    private discoveryEventHandlers: FrameworkEventHandlers = {
        Subscribe: (framework: ITestFramework) => {
            // framework.onTestSessionStart.subscribe(this.TestSessionStart);
            framework.onTestSessionEnd.subscribe(this.discoveryEventHandlers.TestSessionEnd);
            // // framework.onTestSuiteStart.subscribe(this.TestSuiteStart);
            // // framework.onTestSuiteEnd.subscribe(this.TestSuiteEnd);
            framework.onTestCaseStart.subscribe(this.discoveryEventHandlers.TestCaseStart);
            // framework.onTestCaseEnd.subscribe(this.discoveryEventHandlers.TestCaseEnd);
        },

        TestSessionStart: (sender: object, args: TestSessionEventArgs) => {
            return;
        },

        TestSessionEnd: (sender: object, args: TestSessionEventArgs) => {
            console.log('test session end trigger');
            const remainingTests = this.testDiscoveryCache.cleanCache();

            const discoveryCompletePayload: DiscoveryCompletePayload = {
                Metrics: {},
                TotalTests: remainingTests.TotalTestsDiscovered,
                LastDiscoveredTests: remainingTests.DiscoveredTests,
                IsAborted: false
            };

            this.communicationManager.sendMessage(new Message(MessageType.DiscoveryComplete, discoveryCompletePayload, 2));

            this.onComplete.raise(this, null);
        },

        TestSuiteStart: (sender: object, args: TestSuiteEventArgs) => {
            return;
        },

        TestSuiteEnd: (sender: object, args: TestSuiteEventArgs) => {
            return;
        },

        TestCaseStart: (sender: object, args: TestCaseEventArgs) => {
            console.log('adding test case to cache');
            this.testDiscoveryCache.addTest(args.TestCase);
        },

        TestCaseEnd: (sender: object, args: TestCaseEventArgs) => {
            return;
        }
    };

    private testRunStatsChange = (sender: object, args: TestRunChangedEventArgs) => {
        console.log('test run stats change');

        const testRunChangedMessaged = new Message(MessageType.TestRunStatsChange, args, 2);
        this.communicationManager.sendMessage(testRunChangedMessaged);
    }

    private testDiscoveryStatsChange = (sender: object, args: TestsDiscoveredEventArgs) => {
        console.log('tests discovered');

        const testsFoundMessage = new Message(MessageType.TestCasesFound, args.DiscoveredTests, 2);
        this.communicationManager.sendMessage(testsFoundMessage);
    }
}