import { ITestFramework, TestSessionEventArgs, TestSpecEventArgs, TestFrameworks,
         TestErrorMessageEventArgs } from '../../ObjectModel/TestFramework';
import { TestMessageLevel, TestResult, AttachmentSet, JSTestSettings } from '../../ObjectModel';
import { TestCase } from '../../ObjectModel/Common';
import { IEnvironment } from '../../Environment/IEnvironment';
import { TimeSpan } from '../../Utils/TimeUtils';
import { MessageSender } from '../MessageSender';
import { BaseExecutionManager } from './BaseExecutionManager';
import { TestFrameworkEventHandlers } from '../TestFrameworks/TestFrameworkEventHandlers';

export class ExecutionManager extends BaseExecutionManager {
    private jsTestSettings: JSTestSettings;
    private testFramework: TestFrameworks;
    private testCollection: Map<string, TestCase>;

    constructor(environment: IEnvironment, messageSender: MessageSender, jsTestSettings: JSTestSettings) {
        super(environment, messageSender, jsTestSettings.JavaScriptTestFramework);
        this.jsTestSettings = jsTestSettings;
        this.testFramework = this.jsTestSettings.JavaScriptTestFramework;
        this.testSessionManager.onAllSessionsComplete.subscribe(this.executionComplete);
        this.testCollection = null;
    }

    public startTestRunWithSources(sources: Array<string>): Promise<void> {
        const testFrameworkInstance = this.testFrameworkFactory.createTestFramework(this.testFramework);
        if (testFrameworkInstance.canHandleMultipleSources) {
            this.addSessionToSessionManager(sources);
        } else {
            sources.forEach((source => {
                this.addSessionToSessionManager([source]);
            }));
        }

        this.testSessionManager.executeJobs();

        return this.getCompletionPromise();
    }

    public startTestRunWithTests(tests: Array<TestCase>): Promise<void> {
        const sourceMap = {};

        // map each unique TestCase id to the object itself
        this.testCollection = new Map<string, TestCase>();

        tests.forEach((test: TestCase) => {
            this.testCollection.set(test.Id, test);
            if (!sourceMap.hasOwnProperty(test.Source)) {
                sourceMap[test.Source] = 1;
            }
        });

        const sources = Object.keys(sourceMap);
        return this.startTestRunWithSources(sources);
    }

    protected testFrameworkEventHandlers: TestFrameworkEventHandlers = {
        Subscribe: (framework: ITestFramework) => {
            framework.testFrameworkEvents.onTestSessionStart.subscribe(this.testFrameworkEventHandlers.TestSessionStart);
            framework.testFrameworkEvents.onTestSessionEnd.subscribe(this.testFrameworkEventHandlers.TestSessionEnd);
            framework.testFrameworkEvents.onTestCaseStart.subscribe(this.testFrameworkEventHandlers.TestCaseStart);
            framework.testFrameworkEvents.onTestCaseEnd.subscribe(this.testFrameworkEventHandlers.TestCaseEnd);
            framework.testFrameworkEvents.onErrorMessage.subscribe(this.testFrameworkEventHandlers.TestErrorMessage);
        },

        TestSessionStart: (sender: object, args: TestSessionEventArgs) => {
            this.testSessionManager.updateSessionEventArgs(args);
        },

        TestSessionEnd: (sender: object, args: TestSessionEventArgs) => {
            this.testSessionManager.setSessionComplete(args);
        },

        TestCaseStart: (sender: object, args: TestSpecEventArgs) => {
            this.messageSender.sendTestCaseStart(args.TestCase);
        },

        TestCaseEnd: (sender: object, args: TestSpecEventArgs) => {
            const attachments: Array<AttachmentSet> = [];

            const testResult: TestResult = {
                TestCase: args.TestCase,
                Attachments: attachments,
                Outcome: args.Outcome,
                ErrorMessage: null,
                ErrorStackTrace: null,
                DisplayName: args.TestCase.DisplayName,
                Messages: [],
                ComputerName: null,
                Duration: TimeSpan.MSToString(args.EndTime.getTime() - args.StartTime.getTime()),
                StartTime: args.StartTime,
                EndTime: args.EndTime
            };

            // TODO how to handle multiple failed expectations?
            if (args.FailedExpectations.length > 0) {
                testResult.ErrorMessage = args.FailedExpectations[0].Message;
                testResult.ErrorStackTrace = args.FailedExpectations[0].StackTrace;
            }

            this.messageSender.sendTestCaseEnd(testResult);
        },

        TestErrorMessage: (sender: object, args: TestErrorMessageEventArgs) => {
            this.messageSender.sendMessage(args.Message, TestMessageLevel.Error);
        }
    };

    protected sessionError(sources: Array<string>, err: Error) {
        if (err) {
            this.messageSender.sendMessage(err.stack ?
                err.stack :
                (err.constructor.name + ': ' + err.message),
            TestMessageLevel.Error);
        }
    }

    private addSessionToSessionManager(sources: Array<string>) {
        this.testSessionManager.addSession(sources, () => {
            const framework = this.createTestFramework(this.testFramework);
            if (this.testCollection) {
                framework.startExecutionWithTests(sources, this.testCollection, this.jsTestSettings.TestFrameworkConfigJson);
            } else {
                framework.startExecutionWithSources(sources, this.jsTestSettings.TestFrameworkConfigJson);
            }
        },
        (e) => {
            this.sessionError(sources, e);
        });
    }

    private executionComplete = () => {
        this.messageSender.sendExecutionComplete();
        this.onComplete.raise(this, null);
    }
}