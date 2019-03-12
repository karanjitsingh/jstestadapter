import { IEnvironment } from '../../Environment/IEnvironment';
import { JSTestSettings, TestMessageLevel } from '../../ObjectModel';
import { ITestFramework, TestErrorMessageEventArgs, TestFrameworks, TestSessionEventArgs,
         TestSpecEventArgs } from '../../ObjectModel/TestFramework';
import { MessageSender } from '../MessageSender';
import { TestFrameworkEventHandlers } from '../TestFrameworks/TestFrameworkEventHandlers';
import { BaseExecutionManager } from './BaseExecutionManager';

export class DiscoveryManager extends BaseExecutionManager {
    protected readonly jsTestSettings: JSTestSettings;
    protected readonly testFramework: TestFrameworks;

    constructor(environment: IEnvironment, messageSender: MessageSender, jsTestSettings: JSTestSettings) {
        super(environment, messageSender, jsTestSettings.JavaScriptTestFramework);
        this.jsTestSettings = jsTestSettings;
        this.testFramework = this.jsTestSettings.JavaScriptTestFramework;
        this.testSessionManager.onAllSessionsComplete.subscribe(this.discoveryComplete);
    }

    public discoverTests(sources: Array<string>): Promise<void> {
        const testFrameworkInstance = this.testFrameworkFactory.createTestFramework(this.testFramework);
        if (testFrameworkInstance.canHandleMultipleSources) {
            this.addSessionToSessionManager(sources);
        } else {
            sources.forEach(source => {
                this.addSessionToSessionManager([source]);
            });
        }

        this.testSessionManager.executeJobs();

        return this.getCompletionPromise();
    }

    protected testFrameworkEventHandlers: TestFrameworkEventHandlers = {
        Subscribe: (framework: ITestFramework) => {
            framework.testFrameworkEvents.onTestSessionEnd.subscribe(this.testFrameworkEventHandlers.TestSessionEnd);
            framework.testFrameworkEvents.onTestCaseStart.subscribe(this.testFrameworkEventHandlers.TestCaseStart);
            framework.testFrameworkEvents.onErrorMessage.subscribe(this.testFrameworkEventHandlers.TestErrorMessage);
        },

        TestSessionEnd: (sender: object, args: TestSessionEventArgs) => {
            this.testSessionManager.setSessionComplete(args);
        },

        TestCaseStart: (sender: object, args: TestSpecEventArgs) => {
            // this.testDiscoveryCache.addTest(args.TestCase);
            this.messageSender.sendTestCaseFound(args.TestCase);
        },

        TestErrorMessage: (sender: object, args: TestErrorMessageEventArgs) => {
            this.messageSender.sendMessage(args.Message, TestMessageLevel.Error);
        }
    };

    protected sessionError(sources: Array<string>, err: Error) {
        if (err) {
            this.messageSender.sendMessage(err.stack ?
                err.stack :
                (err.constructor.name + ': ' + err.message), TestMessageLevel.Error);
        }

        const currentSession = this.testSessionManager.getSessionEventArgs(sources);

        if (currentSession != null) {
            currentSession.InProgress = false;
            currentSession.EndTime = new Date();
        } else {
            // TODO ??
        }

        this.testSessionManager.setSessionComplete(currentSession);
    }

    private addSessionToSessionManager(sources: Array<string>) {
        this.testSessionManager.addSession(sources, () => {
            const framework = this.createTestFramework(this.testFramework);
            framework.startDiscovery(sources);
        },
        (e) => {
            this.sessionError(sources, e);
        });
    }

    private discoveryComplete = () => {
        this.messageSender.sendDiscoveryComplete();
        this.onComplete.raise(this, null);
    }
}