import { ITestFramework, TestSessionEventArgs, TestCaseEventArgs, TestSuiteEventArgs } from '../ObjectModel/TestFramework';
import { TestRunCompleteEventArgs, TestsDiscoveredEventArgs } from '../ObjectModel/EventArgs';
import { TestRunCriteriaWithSources, DiscoveryCriteria, TestRunChangedEventArgs,
         TestRunCompletePayload, TestRunCriteriaWithTests, TestExecutionContext } from '../ObjectModel/Payloads';
import { TestMessageLevel, TestResult } from '../ObjectModel';
import { EnvironmentType, IEvent, IEventArgs, TestCase } from '../ObjectModel/Common';
import { TestFrameworkFactory, SupportedFramework } from './TestFrameworks/TestFrameworkFactory';
import { IEnvironment } from '../Environment/IEnvironment';
import { TestExecutionCache } from './TestExecutionCache';
import { TimeSpan } from '../Utils/TimeSpan';
import { TestDiscoveryCache } from './TestDiscoveryCache';
import { CSharpException } from '../Exceptions/CSharpException';
import { Exception, ExceptionType } from '../Exceptions/Exception';
import { MessageSender } from './MessageSender';
import { CodeCoverage } from './CodeCoverage';

interface FrameworkEventHandlers {
    Subscribe: (framework: ITestFramework) => void;
    TestSessionStart?: (sender: object, args: TestSessionEventArgs) => void;
    TestSessionEnd?: (sender: object, args: TestSessionEventArgs) => void;
    TestSuiteStart?: (sender: object, args: TestSuiteEventArgs) => void;
    TestSuiteEnd?: (sender: object, args: TestSuiteEventArgs) => void;
    TestCaseStart?: (sender: object, args: TestCaseEventArgs) => void;
    TestCaseEnd?: (sender: object, args: TestCaseEventArgs) => void;
}

export class TestRunner {
    private readonly environment: IEnvironment;
    private readonly messageSender: MessageSender;
    private readonly testFrameworkFactory: TestFrameworkFactory;
    private readonly testFramework: SupportedFramework;
    private readonly onComplete: IEvent<IEventArgs>;
    private testExecutionCache: TestExecutionCache;
    private testDiscoveryCache: TestDiscoveryCache;
    private currentTestSession: TestSessionEventArgs;
    private codecoverage: CodeCoverage;

    constructor(environment: IEnvironment, messageSender: MessageSender, testFramework: SupportedFramework) {
        this.environment = environment;
        this.messageSender = messageSender;
        this.onComplete = environment.createEvent();
        this.testFramework = testFramework;
        this.testFrameworkFactory = new TestFrameworkFactory(this.environment);
    }

    public discoverTests(criteria: DiscoveryCriteria): Promise<void> {
        const framework = this.testFrameworkFactory.getTestFramework(this.testFramework);
        const sources = criteria.AdapterSourceMap[Object.keys(criteria.AdapterSourceMap)[0]];

        this.testDiscoveryCache = new TestDiscoveryCache(this.environment,
                                                         criteria.FrequencyOfDiscoveredTestsEvent,
                                                         criteria.DiscoveredTestEventTimeout);

        this.testDiscoveryCache.onReportTestCases.subscribe(this.testDiscoveryStatsChange);

        this.discoveryEventHandlers.Subscribe(framework);
        
        return this.createCompletionPromise(() => {
            framework.startDiscovery(sources[0]);
        }, (e) => {
            this.discoveryComplete(null, e);
        });
    }

    public startTestRunWithSources(criteria: TestRunCriteriaWithSources): Promise<void> {
        const framework = this.testFrameworkFactory.getTestFramework(this.testFramework);
        const sources = criteria.AdapterSourceMap[Object.keys(criteria.AdapterSourceMap)[0]];
    
        this.codecoverage = new CodeCoverage(sources[0]);
        return this.startExecution(criteria.TestExecutionContext, framework, () => {
            framework.startExecutionWithSource(sources[0]);
        }, sources[0]);
    }

    public startTestRunWithTests(criteria: TestRunCriteriaWithTests): Promise<void> {
        const sourceTestMap = new Map<string, Map<string, TestCase>>();

        criteria.Tests.forEach((test: TestCase) => {
            if (sourceTestMap.has(test.Source)) {
                const testCollection = sourceTestMap.get(test.Source);
                testCollection.set(test.Id, test);
            } else {
                const idMap = new Map<string, TestCase>();
                idMap.set(test.Id, test);
                sourceTestMap.set(test.Source, idMap);
            } 
        });

        const source = sourceTestMap.keys().next().value;

        const framework = this.testFrameworkFactory.getTestFramework(this.testFramework);     

        return this.startExecution(criteria.TestExecutionContext, framework, () => {
            framework.startExecutionWithTests(source, sourceTestMap.get(source));
        });
    }

    private startExecution(executionContext: TestExecutionContext, framework: ITestFramework, executeJob: () => void, source?: string):
    Promise<void> {
        this.testExecutionCache = new TestExecutionCache(this.environment,
                                                         executionContext.FrequencyOfRunStatsChangeEvent,
                                                         executionContext.RunStatsChangeEventTimeout);

        this.testExecutionCache.onTestRunStatsChange.subscribe(this.testRunStatsChange);
        this.executionEventHandlers.Subscribe(framework);
        return this.createCompletionPromise(executeJob, (e) => {
            this.executionComplete(null, e);
        });
    }

    private createCompletionPromise(executeJob: () => void , jobCallback: (e?: Error) => void, source?: string): Promise<void> {
        return new Promise((resolve) => {
            try {
                if (this.environment.environmentType === EnvironmentType.NodeJS) {
                    // tslint:disable-next-line:no-require-imports
                    const domain = require('domain').create();
        
                    domain.on('error', (err: Error) => {
                        jobCallback(err);
                    });
                    domain.run(() => {
                        this.codecoverage.startCoverage(executeJob);
                    });
                } else if (this.environment.environmentType === EnvironmentType.Browser) {
                    throw new Exception('TestRunner.runInIsolation: Not implemented for browser',
                                        ExceptionType.NotImplementedException);
                }
            } catch (err) {
                this.executionComplete(null, err);
                // TODO log message
            }

            this.onComplete.subscribe((sender: object, args: IEventArgs) => {
                resolve();
            });
        });
    }

    private executionComplete(args: TestSessionEventArgs, err?: Error): void {
        console.log('test session end trigger');
        this.codecoverage.stopCoverage();

        if (err) {
            this.messageSender.sendMessage(err.stack ?
                err.stack :
                (err.constructor.name + ': ' + err.message + ' at ' + this.currentTestSession.Source),
            TestMessageLevel.Error);
        }

        const remainingTestResults = this.testExecutionCache.cleanCache();
        const timeElapsed = args ? 
                            TimeSpan.MSToString(args.StartTime.getTime() - this.currentTestSession.StartTime.getTime()) :
                            TimeSpan.MSToString(new Date().getTime() - this.currentTestSession.StartTime.getTime());

        const testRunCompleteEventArgs = <TestRunCompleteEventArgs> {
            TestRunStatistics: remainingTestResults.TestRunStatistics,
            IsCanceled: false,
            IsAborted: false,
            Error: err ? new CSharpException(err, this.currentTestSession.Source) : null,
            AttachmentSets: [],
            ElapsedTimeInRunningTests: timeElapsed,
            Metrics: {}
        };

        // TODO hardcoded executor uris
        const testRuncompletePayload = <TestRunCompletePayload> {
            TestRunCompleteArgs: testRunCompleteEventArgs,
            LastRunTests: remainingTestResults,
            RunAttachments: [],
            ExecutorUris: ['executor: //JasmineTestAdapter/v1']
        };

        this.messageSender.sendExecutionComplete(testRuncompletePayload);

        this.onComplete.raise(this, null);
    }

    private discoveryComplete(args: TestsDiscoveredEventArgs, err?: Error): void {
        console.log('test session end trigger');

        if (err) {
            this.messageSender.sendMessage(err.stack ?
                err.stack :
                (err.constructor.name + ': ' + err.message + ' at ' + this.currentTestSession.Source),
            TestMessageLevel.Error);
        }

        this.messageSender.sendDiscoveryComplete(args);
        this.onComplete.raise(this, null);
    }

    private executionEventHandlers: FrameworkEventHandlers = {
        Subscribe: (framework: ITestFramework) => {
            framework.testFrameworkEvents.onTestSessionStart.subscribe(this.executionEventHandlers.TestSessionStart);
            framework.testFrameworkEvents.onTestSessionEnd.subscribe(this.executionEventHandlers.TestSessionEnd);
            framework.testFrameworkEvents.onTestCaseStart.subscribe(this.executionEventHandlers.TestCaseStart);
            framework.testFrameworkEvents.onTestCaseEnd.subscribe(this.executionEventHandlers.TestCaseEnd);
        },

        TestSessionStart: (sender: object, args: TestSessionEventArgs) => {
            this.currentTestSession = args;
        },

        TestSessionEnd: (sender: object, args: TestSessionEventArgs) => {
            console.log('test session end trigger');
            this.executionComplete(args);
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
            framework.testFrameworkEvents.onTestSessionEnd.subscribe(this.discoveryEventHandlers.TestSessionEnd);
            framework.testFrameworkEvents.onTestCaseStart.subscribe(this.discoveryEventHandlers.TestCaseStart);
        },

        TestSessionEnd: (sender: object, args: TestSessionEventArgs) => {
            console.log('test session end trigger');
            const remainingTests = this.testDiscoveryCache.cleanCache();
            this.discoveryComplete(remainingTests);
        },

        TestCaseStart: (sender: object, args: TestCaseEventArgs) => {
            console.log('adding test case to cache');
            this.testDiscoveryCache.addTest(args.TestCase);
        }
    };

    private testRunStatsChange = (sender: object, args: TestRunChangedEventArgs) => {
        console.log('test run stats change');
        this.messageSender.sendTestRunChange(args);
    }

    private testDiscoveryStatsChange = (sender: object, args: TestsDiscoveredEventArgs) => {
        console.log('tests discovered');
        this.messageSender.sendDiscoveryStatsChange(args.DiscoveredTests);
    }
}