import { ITestFramework, TestSessionEventArgs, TestSpecEventArgs, TestSuiteEventArgs } from '../ObjectModel/TestFramework';
import { TestRunCompleteEventArgs, TestsDiscoveredEventArgs } from '../ObjectModel/EventArgs';
import { TestRunCriteriaWithSources, DiscoveryCriteria, TestRunChangedEventArgs, TestRunCompletePayload,
         TestRunCriteriaWithTests, TestExecutionContext, TestCaseStartEventArgs, TestCaseEndEventArgs } from '../ObjectModel/Payloads';
import { TestMessageLevel, TestResult, AttachmentSet } from '../ObjectModel';
import { EnvironmentType, IEvent, IEventArgs, TestCase } from '../ObjectModel/Common';
import { TestFrameworkFactory, SupportedFramework } from './TestFrameworks/TestFrameworkFactory';
import { CSharpException, Exception, ExceptionType } from '../Exceptions';
import { TestExecutionCache, TestDiscoveryCache } from './TestCache';
import { IEnvironment } from '../Environment/IEnvironment';
import { TimeSpan } from '../Utils/TimeSpan';
import { MessageSender } from './MessageSender';
// import { CodeCoverage } from './CodeCoverage';
import { RunSettings } from './RunSettings';

interface FrameworkEventHandlers {
    Subscribe: (framework: ITestFramework) => void;
    TestSessionStart?: (sender: object, args: TestSessionEventArgs) => void;
    TestSessionEnd?: (sender: object, args: TestSessionEventArgs) => void;
    TestSuiteStart?: (sender: object, args: TestSuiteEventArgs) => void;
    TestSuiteEnd?: (sender: object, args: TestSuiteEventArgs) => void;
    TestCaseStart?: (sender: object, args: TestSpecEventArgs) => void;
    TestCaseEnd?: (sender: object, args: TestSpecEventArgs) => void;
}

export class TestRunner {
    private readonly environment: IEnvironment;
    private readonly messageSender: MessageSender;
    private readonly testFrameworkFactory: TestFrameworkFactory;
    private readonly testFramework: ITestFramework;
    private readonly onComplete: IEvent<IEventArgs>;

    private testExecutionCache: TestExecutionCache;
    private testDiscoveryCache: TestDiscoveryCache;
    private testSessionBucket: Map<string, TestSessionEventArgs>;
    private sessionCompleteCount: number;
    // private codecoverage: CodeCoverage;
    private runSettings: RunSettings;

    constructor(environment: IEnvironment, messageSender: MessageSender, testFramework: SupportedFramework) {
        this.environment = environment;

        if (this.environment.environmentType !== EnvironmentType.NodeJS) {
            throw new Exception('Not implemented', ExceptionType.NotImplementedException);
        }

        this.messageSender = messageSender;
        this.onComplete = environment.createEvent();
        this.testFrameworkFactory = new TestFrameworkFactory(this.environment);
        this.testFramework = this.testFrameworkFactory.getTestFramework(testFramework);
    }

    // public discoverTests(criteria: DiscoveryCriteria): Promise<void> {
    //     this.setRunSettingsFromXml(criteria.RunSettings);
        
    //     const sources = criteria.AdapterSourceMap[Object.keys(criteria.AdapterSourceMap)[0]];

    //     this.testDiscoveryCache = new TestDiscoveryCache(this.environment,
    //                                                      criteria.FrequencyOfDiscoveredTestsEvent,
    //                                                      criteria.DiscoveredTestEventTimeout);

    //     this.testDiscoveryCache.onReportTestCases.subscribe(this.testDiscoveryStatsChange);

    //     this.discoveryEventHandlers.Subscribe(this.testFramework);
        
    //     return this.createCompletionPromise(() => {
    //         this.testFramework.startDiscovery(sources[0]);
    //     }, (e) => {
    //         this.discoveryComplete(null, e);
    //     });
    // }

    public startTestRunWithSources(criteria: TestRunCriteriaWithSources): Promise<void> {
        // this.setRunSettingsFromXml(criteria.RunSettings);
        
        // const sourceList: Array<string> = [];

        // for (let key in Object.keys(criteria.AdapterSourceMap)) {
        //     sourceList.concat(criteria)
        // }

        // const sources = criteria.AdapterSourceMap[Object.keys(criteria.AdapterSourceMap)[0]];
    
        // // this.codecoverage = new CodeCoverage(sources[0]);
        // return this.startExecution(criteria.TestExecutionContext, this.testFramework, () => {
        //     this.testFramework.startExecutionWithSource(sources[0]);
        // }, sources[0]);


    }

    public startTestRunWithTests(criteria: TestRunCriteriaWithTests): Promise<void> {
        this.setRunSettingsFromXml(criteria.RunSettings);
        
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

        return this.startExecution(criteria.TestExecutionContext, this.testFramework, () => {
            this.testFramework.startExecutionWithTests(source, sourceTestMap.get(source));
        });
    }

    private setRunSettingsFromXml(runSettingsXml: string) {
        this.runSettings = new RunSettings(runSettingsXml, this.environment.getXmlParser());
    }

    private startExecution(executionContext: TestExecutionContext, executeJob: () => void, sourceList: Array<string>): Promise<void> {
        // this.testExecutionCache = new TestExecutionCache(this.environment,
        //                                                  executionContext.FrequencyOfRunStatsChangeEvent,
        //                                                  executionContext.RunStatsChangeEventTimeout);

        // this.testExecutionCache.onTestRunStatsChange.subscribe(this.testRunStatsChange);
        // this.executionEventHandlers.Subscribe(framework);
        // return this.createCompletionPromise(executeJob, (e) => {
        //     this.executionComplete(null, e);
        // });

        // tslint:disable-next-line:no-require-imports
        const domain = require('domain');

        sourceList.forEach(source => {
            const executionDomain = domain.create();
            try {
                domain.on('error', (err: Error) => {
                    this.sessionComplete(source, null, err);
                });
                domain.run(() => {
                    // this.codecoverage.startCoverage(executeJob);
                    executeJob();
                });
            } catch (err) {
                console.error('domain did not catch the error. hmmmm');
                this.sessionComplete(source, null, err);
                // TODO log message
            }
        });

        return this.getCompletetionPromise();
    }

    private sessionComplete(source: string, args?: TestSessionEventArgs, err?: Error) {
        if (err) {
            this.messageSender.sendMessage(err.stack ?
                err.stack :
                (err.constructor.name + ': ' + err.message + ' at ' + source),
            TestMessageLevel.Error);
        }

        if (args) {
            this.testSessionBucket.set(source, args);
        } else {
            const args: TestSessionEventArgs = this.testSessionBucket.get(source);
            args.InProgress = false;
            args.EndTime = new Date();
        }
    }

    private getCompletetionPromise(): Promise<void> {
        return new Promise((resolve) => {
            this.onComplete.subscribe((sender: object, args: IEventArgs) => {
                resolve();
            });
        });
    }

    private executionComplete(args: TestSessionEventArgs, err?: Error): void {
        console.log('test session end trigger');
        // this.codecoverage.stopCoverage();


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
            ExecutorUris: ['executor: //JasmineTestAdapter/v1']     // TODO hardcoded 
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
            if (this.testSessionBucket.has(args.Source)) {
                // log session duplication
            }
            this.testSessionBucket.set(args.Source, args);
        },

        TestSessionEnd: (sender: object, args: TestSessionEventArgs) => {
            console.log('test session end trigger');
            if (this.testSessionBucket.has(args.Source)) {
                this.testSessionBucket.delete(args.Source);
            } else {
                // log test session should've been in bucket. testsessionstart was not called?
            }
            this.executionComplete(args);
        },

        TestCaseStart: (sender: object, args: TestSpecEventArgs) => {
            console.log('adding test case to cache');

            if (this.runSettings.isDataCollectionEnabled()) {
                const testCaseStart = <TestCaseStartEventArgs> {
                    TestCaseId: args.TestCase.Id,
                    TestCaseName: args.TestCase.DisplayName,
                    TestElement: null,
                    IsChildTestCase: false              // TODO what is is child test case
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

        TestCaseStart: (sender: object, args: TestSpecEventArgs) => {
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