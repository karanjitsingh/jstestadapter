import { MessageType } from '../ObjectModel';
import { TestRunCriteriaWithSources, DiscoveryCriteria, TestRunCriteriaWithTests } from '../ObjectModel/Payloads';
import { IEnvironment } from '../Environment/IEnvironment';
import { ICommunicationManager, MessageReceivedEventArgs } from '../Environment/ICommunicationManager';
import { Exception, ExceptionType } from '../Exceptions/Exception';
import { JobQueue } from '../Utils/JobQueue';
import { TestRunner } from './TestRunner';
import { MessageSender } from './MessageSender';

const ipRegex = /^(?!.*\.$)((?!0\d)(1?\d?\d|25[0-5]|2[0-4]\d)(\.|$)){4}$/;

export class TestHost {
    private readonly environment: IEnvironment;
    private readonly communicationManager: ICommunicationManager;
    private readonly jobQueue: JobQueue;
    private readonly testRunner: TestRunner;
    private readonly messageSender: MessageSender;
    private sessionEnded: boolean;

    constructor(environment: IEnvironment) {
        this.environment = environment;
        this.validateArguments(this.environment.argv);
        
        this.sessionEnded = false;
               
        this.communicationManager = environment.createCommunicationManager();
        this.initializeCommunication();
        
        this.jobQueue = new JobQueue();
        this.messageSender = new MessageSender(this.communicationManager);
        this.testRunner = new TestRunner(environment, this.messageSender);
    }

    private initializeCommunication() {
        this.communicationManager.onMessageReceived.subscribe(this.messageReceived);
        this.communicationManager.connectToServer(Number(this.environment.argv[2]), '127.0.0.1');
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
                const runWithSourcesPayload = <TestRunCriteriaWithSources>message.Payload;
                this.jobQueue.queuePromise(this.testRunner.startTestRunWithSources(runWithSourcesPayload));
                break;

            case MessageType.StartTestExecutionWithTests:
                const runWithTestsPayload = <TestRunCriteriaWithTests>message.Payload;
                this.jobQueue.queuePromise(this.testRunner.startTestRunWithTests(runWithTestsPayload));
                break;

            case MessageType.StartDiscovery:
                const discoveryPayload = <DiscoveryCriteria>message.Payload;
                this.jobQueue.queuePromise(this.testRunner.discoverTests(discoveryPayload));
                break;

            case MessageType.SessionEnd:
                this.sessionEnded = true;
        }
    }

    private validateArguments(args: Array<string>) {
        if (isNaN(Number(args[2]))) {
            throw new Exception('Invalid Port.', ExceptionType.InvalidArgumentsException);
        }

        if (args[3] === undefined || args[3].match(ipRegex)) {
            throw new Exception('Invalid IP.', ExceptionType.InvalidArgumentsException);
        }
    }
}