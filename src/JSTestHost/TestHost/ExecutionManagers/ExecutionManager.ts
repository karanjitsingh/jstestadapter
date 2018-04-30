import { ITestFramework, TestSessionEventArgs, TestSpecEventArgs } from '../../ObjectModel/TestFramework';
import { TestRunCompleteEventArgs } from '../../ObjectModel/EventArgs';
import { TestRunCriteriaWithSources, TestRunChangedEventArgs, TestRunCompletePayload,
         TestRunCriteriaWithTests, TestExecutionContext, TestCaseStartEventArgs, TestCaseEndEventArgs } from '../../ObjectModel/Payloads';
import { TestMessageLevel, TestResult, AttachmentSet } from '../../ObjectModel';
import { TestCase } from '../../ObjectModel/Common';
import { SupportedFramework } from '../TestFrameworks/TestFrameworkFactory';
import { CSharpException, Exception, ExceptionType } from '../../Exceptions';
import { IEnvironment } from '../../Environment/IEnvironment';
import { TimeSpan } from '../../Utils/TimeSpan';
import { MessageSender } from '../MessageSender';
// import { CodeCoverage } from './CodeCoverage';
import { BaseExecutionManager } from './BaseExecutionManager';
import { TestExecutionCache } from '../TestCache';
import { TestFrameworkEventHandlers } from '../TestFrameworks/TestFrameworkEventHandlers';

export class ExecutionManager extends BaseExecutionManager {

    private testExecutionCache: TestExecutionCache;
    private testFramework: SupportedFramework;
    private startTime: Date;

    constructor(environment: IEnvironment, messageSender: MessageSender, testFramework: SupportedFramework) {
        super(environment, messageSender, testFramework);
        this.testFramework = testFramework;
        this.testSessionManager.onSessionsComplete.subscribe(this.executionComplete);
    }

    public startTestRunWithSources(criteria: TestRunCriteriaWithSources): Promise<void> {
        this.setRunSettingsFromXml(criteria.RunSettings);
        const sources = this.getSourcesFromAdapterSourceMap(criteria.AdapterSourceMap);
        return this.startExecution(criteria.TestExecutionContext, sources);
    }

    public startTestRunWithTests(criteria: TestRunCriteriaWithTests): Promise<void> {
        this.setRunSettingsFromXml(criteria.RunSettings);
        
        const sourceMap = {};

        criteria.Tests.forEach((test: TestCase) => {
            if (!sourceMap.hasOwnProperty(test.Source)) {
                sourceMap[test.Source] = 1;
            }
        });
     
        const sources = Object.keys(sourceMap);
        return this.startExecution(criteria.TestExecutionContext, sources);
    }

    private startExecution(context: TestExecutionContext, sources: Array<string>): Promise<void> {
        this.startTime = new Date();
        
        this.testExecutionCache = new TestExecutionCache(this.environment,
                                                         context.FrequencyOfRunStatsChangeEvent,
                                                         context.RunStatsChangeEventTimeout);

        this.testExecutionCache.onTestRunStatsChange.subscribe(this.runStatsChange);
        
        sources.forEach(source => {
            this.testSessionManager.addSession(source, () => {
                const testFrameworkInstance = this.testFrameworkFactory.createTestFramework(this.testFramework);
                this.testFrameworkEventHandlers.Subscribe(testFrameworkInstance);
                testFrameworkInstance.startExecutionWithSource(source);
            },
            (e) => {
                this.sessionError(source, e);
            });
        });

        return this.getCompletetionPromise();
    }
    
    private sessionError(source: string, err: Error) {
        if (err) {
            this.messageSender.sendMessage(err.stack ?
                err.stack :
                (err.constructor.name + ': ' + err.message + ' at ' + source),
            TestMessageLevel.Error);
        }

        const currentSession = this.testSessionManager.getSessionEventArgs(source);

        if (currentSession != null) {
            currentSession.InProgress = false;
            currentSession.EndTime = new Date();
        } else {
            // TODO ??
        }

        this.testSessionManager.setSessionComplete(currentSession);
    }

    private executionComplete = () => {
        console.log('test session end trigger');

        const remainingTestResults = this.testExecutionCache.cleanCache();
        const timeElapsed = TimeSpan.MSToString(new Date().getTime() - this.startTime.getTime());

        const testRunCompleteEventArgs = <TestRunCompleteEventArgs> {
            TestRunStatistics: remainingTestResults.TestRunStatistics,
            IsCanceled: false,
            IsAborted: false,
            Error: null,            // sending multiple errors?
            AttachmentSets: [],
            ElapsedTimeInRunningTests: timeElapsed,
            Metrics: {}
        };

        // TODO hardcoded executor uris
        const testRuncompletePayload = <TestRunCompletePayload> {
            TestRunCompleteArgs: testRunCompleteEventArgs,
            LastRunTests: remainingTestResults,
            RunAttachments: [],
            ExecutorUris: ['executor: //JasmineTestAdapter/v1']     // TODO hardcoded 
        };

        this.messageSender.sendExecutionComplete(testRuncompletePayload);
        this.onComplete.raise(this, null);
    }

    protected testFrameworkEventHandlers: TestFrameworkEventHandlers = {
        Subscribe: (framework: ITestFramework) => {
            framework.testFrameworkEvents.onTestSessionStart.subscribe(this.testFrameworkEventHandlers.TestSessionStart);
            framework.testFrameworkEvents.onTestSessionEnd.subscribe(this.testFrameworkEventHandlers.TestSessionEnd);
            framework.testFrameworkEvents.onTestCaseStart.subscribe(this.testFrameworkEventHandlers.TestCaseStart);
            framework.testFrameworkEvents.onTestCaseEnd.subscribe(this.testFrameworkEventHandlers.TestCaseEnd);
        },

        TestSessionStart: (sender: object, args: TestSessionEventArgs) => {
            console.log('test session start trigger');
            this.testSessionManager.updateSessionEventArgs(args);
        },

        TestSessionEnd: (sender: object, args: TestSessionEventArgs) => {
            console.log('test session end trigger');
            this.testSessionManager.setSessionComplete(args);
        },

        TestCaseStart: (sender: object, args: TestSpecEventArgs) => {
            console.log('adding test case to cache');

            if (this.runSettings.isDataCollectionEnabled()) {
                const testCaseStart = <TestCaseStartEventArgs> {
                    TestCaseId: args.TestCase.Id,
                    TestCaseName: args.TestCase.DisplayName,
                    TestElement: null,
                    IsChildTestCase: false              // TODO what is child test case
                };
                this.messageSender.sendTestCaseStart(testCaseStart);
            }

            this.testExecutionCache.addInProgressTest(args.TestCase);
        },

        TestCaseEnd: (sender: object, args: TestSpecEventArgs) => {
            console.log('adding test result to cache');

            let attachments: Array<AttachmentSet> = [];

            if (this.runSettings.isDataCollectionEnabled()) {
                const testCaseEnd = <TestCaseEndEventArgs> {
                    TestOutcome: args.Outcome,
                    TestCaseId: args.TestCase.Id,
                    TestCaseName: args.TestCase.DisplayName,
                    TestElement: null,
                    IsChildTestCase: false              // TODO what is is child test case
                };
                attachments = this.messageSender.sendTestCaseEnd(testCaseEnd);
            }

            // TODO incomplete test results - display name etc are null
            const testResult: TestResult = {
                TestCase: args.TestCase,
                Attachments: attachments,               // TODO simply send attachments received from dc?
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

    protected runStatsChange = (sender: object, args: TestRunChangedEventArgs) => {
        console.log('test run stats change');
        this.messageSender.sendTestRunChange(args);
    }

}