// import { TestRunCriteriaWithSources, DiscoveryCriteria, TestRunCriteriaWithTests } from '../ObjectModel/TPPayloads';
import { MessageType, JSTestSettings } from '../ObjectModel';
import { IEnvironment } from '../Environment/IEnvironment';
import { ICommunicationManager, MessageReceivedEventArgs } from '../Environment/ICommunicationManager';
import { JobQueue } from '../Utils/JobQueue';
import { MessageSender } from './MessageSender';
import { ExecutionManager, DiscoveryManager } from './ExecutionManagers';
import { StartExecutionWithSourcesPayload, StartExecutionWithTestsPayload, StartDiscoveryPayload } from '../ObjectModel/Payloads';

export class TestRunner {
    private readonly environment: IEnvironment;
    private readonly communicationManager: ICommunicationManager;
    private readonly jobQueue: JobQueue;
    private readonly messageSender: MessageSender;

    private testRunSettings: JSTestSettings;
    private sessionEnded: boolean;

    constructor(environment: IEnvironment) {
        this.environment = environment;
        this.sessionEnded = false;
        this.jobQueue = new JobQueue();
        // this.testHostSettings = ArgumentProcessor.processArguments(this.environment.argv);

        const dcCommManager: ICommunicationManager = null;
        // if (this.testHostSettings.DataCollectionPort) {
        //     dcCommManager = environment.createCommunicationManager();
        // }
        this.communicationManager = environment.getCommunicationManager();
        this.messageSender = new MessageSender(this.communicationManager, dcCommManager);

        this.initializeCommunication();
    }

    private initializeCommunication() {
        const message = this.communicationManager.receiveMessageSync();

        if (message.MessageType === MessageType.TestRunSettings && message.Version === MessageSender.protocolVersion) {
            this.testRunSettings = new JSTestSettings(message.Payload);
        } else {
            // log
        }

        this.messageSender.sendVersionCheck();
        this.communicationManager.onMessageReceived.subscribe(this.messageReceived);
        this.waitForSessionEnd();
    }

    private waitForSessionEnd() {
        if (!this.sessionEnded) {
            setTimeout(this.waitForSessionEnd.bind(this), 1000);
        }
    }

    private messageReceived = (sender: object, args: MessageReceivedEventArgs) => {
        const message = args.Message;
        console.log('Message Received', message);

        switch (message.MessageType) {

            case MessageType.VersionCheck:
                this.messageSender.sendVersionCheck();
                break;

            case MessageType.StartTestExecutionWithSources:
                const executionManager = new ExecutionManager(this.environment, this.messageSender, this.testRunSettings);
                const runWithSourcesPayload = <StartExecutionWithSourcesPayload>message.Payload;

                this.jobQueue.queuePromise(executionManager.startTestRunWithSources(runWithSourcesPayload));
                break;

            case MessageType.StartTestExecutionWithTests:
                const executionManager2 = new ExecutionManager(this.environment, this.messageSender, this.testRunSettings);
                const runWithTestsPayload = <StartExecutionWithTestsPayload>message.Payload;

                this.jobQueue.queuePromise(executionManager2.startTestRunWithTests(runWithTestsPayload));
                break;

            case MessageType.StartDiscovery:
                const discoveryManager = new DiscoveryManager(this.environment, this.messageSender, this.testRunSettings);
                const discoveryPayload = <StartDiscoveryPayload>message.Payload;

                this.jobQueue.queuePromise(discoveryManager.discoverTests(discoveryPayload));
                break;

            // case MessageType.SessionEnd:
            //     this.sessionEnded = true;
            //     process.exit(0);
        }
    }

}