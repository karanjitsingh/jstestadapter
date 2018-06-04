import { ITestFramework, TestSessionEventArgs, TestSpecEventArgs, TestFrameworks,
         TestErrorMessageEventArgs } from '../../ObjectModel/TestFramework';
import { TestMessageLevel, TestResult, AttachmentSet, JSTestSettings } from '../../ObjectModel';
import { TestCase } from '../../ObjectModel/Common';
import { IEnvironment } from '../../Environment/IEnvironment';
import { TimeSpan } from '../../Utils/TimeSpan';
import { MessageSender } from '../MessageSender';
import { BaseExecutionManager } from './BaseExecutionManager';
import { TestFrameworkEventHandlers } from '../TestFrameworks/TestFrameworkEventHandlers';
import { StartExecutionWithSourcesPayload, StartExecutionWithTestsPayload } from '../../ObjectModel/Payloads';

export class ExecutionManager extends BaseExecutionManager {
    private jsTestSettings: JSTestSettings;
    private testFramework: TestFrameworks;

    constructor(environment: IEnvironment, messageSender: MessageSender, jsTestSettings: JSTestSettings) {
        super(environment, messageSender, jsTestSettings.JavaScriptTestFramework);
        this.jsTestSettings = jsTestSettings;
        this.testFramework = this.jsTestSettings.JavaScriptTestFramework;
        this.testSessionManager.onAllSessionsComplete.subscribe(this.executionComplete);
    }

    public startTestRunWithSources(request: StartExecutionWithSourcesPayload): Promise<void> {
        const sources = request.Sources;
        return this.startExecution(sources);
    }

    public startTestRunWithTests(request: StartExecutionWithTestsPayload): Promise<void> {
        
        const sourceMap = {};

        request.Tests.forEach((test: TestCase) => {
            if (!sourceMap.hasOwnProperty(test.Source)) {
                sourceMap[test.Source] = 1;
            }
        });
     
        const sources = Object.keys(sourceMap);
        return this.startExecution(sources);
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
            console.log('test session start trigger');
            this.testSessionManager.updateSessionEventArgs(args);
        },

        TestSessionEnd: (sender: object, args: TestSessionEventArgs) => {
            console.log('test session end trigger');
            this.testSessionManager.setSessionComplete(args);
        },

        TestCaseStart: (sender: object, args: TestSpecEventArgs) => {
            console.log('adding test case to cache');

            this.messageSender.sendTestCaseStart(args.TestCase);    

        },

        TestCaseEnd: (sender: object, args: TestSpecEventArgs) => {
            console.log('adding test result to cache');

            const attachments: Array<AttachmentSet> = [];

            // TODO incomplete test results - display name etc are null
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

    private addSessionToSessionManager(sources: Array<string>) {
        this.testSessionManager.addSession(sources, () => {
            const testFrameworkInstance = this.testFrameworkFactory.createTestFramework(this.testFramework);
            testFrameworkInstance.initialize();
            this.testFrameworkEventHandlers.Subscribe(testFrameworkInstance);
            testFrameworkInstance.startExecutionWithSources(sources, this.jsTestSettings.TestFrameworkConfigJson);
        },
        (e) => {
            this.sessionError(sources, e);
        });
    }
    
    protected startExecution(sources: Array<string>): Promise<void> {

        const testFrameworkInstance = this.testFrameworkFactory.createTestFramework(this.testFramework);
        if (testFrameworkInstance.canHandleMultipleSources) {
            this.addSessionToSessionManager(sources);
        } else {
            sources.forEach((source => {
                this.addSessionToSessionManager([source]);
            }));
        }

        return this.getCompletionPromise();
    }

    protected sessionError(sources: Array<string>, err: Error) {
        if (err) {
            this.messageSender.sendMessage(err.stack ?
                err.stack :
                (err.constructor.name + ': ' + err.message),
            TestMessageLevel.Error);
        }
    }

    private executionComplete = () => {
        console.log('test session end trigger');

        this.messageSender.sendExecutionComplete();
        this.onComplete.raise(this, null);
    }
}