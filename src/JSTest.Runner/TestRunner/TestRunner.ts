import { MessageType, JSTestSettings } from '../ObjectModel';
import { IEnvironment } from '../Environment/IEnvironment';
import { ICommunicationManager, MessageReceivedEventArgs } from '../Environment/ICommunicationManager';
import { JobQueue } from '../Utils/JobQueue';
import { MessageSender } from './MessageSender';
import { ExecutionManager, DiscoveryManager } from './ExecutionManagers';
import { StartExecutionWithSourcesPayload, StartExecutionWithTestsPayload, StartDiscoveryPayload } from '../ObjectModel/Payloads';
import { TestFrameworkFactory } from './TestFrameworks/TestFrameworkFactory';
import { TestSessionManager } from './ExecutionManagers/TestSessionManager';

export class TestRunner {
    private readonly environment: IEnvironment;
    private readonly communicationManager: ICommunicationManager;
    private readonly jobQueue: JobQueue;
    private readonly messageSender: MessageSender;

    private jsTestSettings: JSTestSettings;
    private sessionEnded: boolean;

    constructor(environment: IEnvironment) {
        this.environment = environment;
        this.sessionEnded = false;
        this.jobQueue = new JobQueue();

        const dcCommManager: ICommunicationManager = null;
        this.communicationManager = environment.getCommunicationManager();
        this.messageSender = new MessageSender(this.communicationManager, dcCommManager);

        this.initializeCommunication();
    }

    private initializeCommunication() {
        this.communicationManager.onMessageReceived.subscribe(this.messageReceived);
        this.communicationManager.connectToServer(this.environment.argv[2], Number(this.environment.argv[3]));
        this.waitForSessionEnd();
    }

    private waitForSessionEnd() {
        if (!this.sessionEnded) {
            setTimeout(this.waitForSessionEnd.bind(this), 1000);
        }
    }

    private messageReceived = (sender: object, args: MessageReceivedEventArgs) => {
        const message = args.Message;
        switch (message.MessageType) {

            case MessageType.TestRunSettings:
                if (message.Version === MessageSender.protocolVersion) {
                    this.jsTestSettings = new JSTestSettings(message.Payload);
                } else {
                    // log
                }

                this.messageSender.sendVersionCheck();
                break;

            case MessageType.VersionCheck:
                this.messageSender.sendVersionCheck();
                break;

            case MessageType.StartTestExecutionWithSources:
                this.initializeSingletons();

                const executionManager = new ExecutionManager(this.environment, this.messageSender, this.jsTestSettings);
                const runWithSourcesPayload = <StartExecutionWithSourcesPayload>message.Payload;

                this.jobQueue.queuePromise(executionManager.startTestRunWithSources(runWithSourcesPayload.Sources));
                break;

            case MessageType.StartTestExecutionWithTests:
                this.initializeSingletons();

                const executionManager2 = new ExecutionManager(this.environment, this.messageSender, this.jsTestSettings);
                const runWithTestsPayload = <StartExecutionWithTestsPayload>message.Payload;

                this.jobQueue.queuePromise(executionManager2.startTestRunWithTests(runWithTestsPayload.Tests));
                break;

            case MessageType.StartDiscovery:
                this.initializeSingletons();

                const discoveryManager = new DiscoveryManager(this.environment, this.messageSender, this.jsTestSettings);
                const discoveryPayload = <StartDiscoveryPayload>message.Payload;

                this.jobQueue.queuePromise(discoveryManager.discoverTests(discoveryPayload.Sources));
                break;

            // case MessageType.SessionEnd:
            //     this.sessionEnded = true;
            //     process.exit(0);
        }
    }

    private initializeSingletons() {
        TestFrameworkFactory.INITIALIZE(this.environment);
        TestSessionManager.INITIALIZE(this.environment);
    }

}