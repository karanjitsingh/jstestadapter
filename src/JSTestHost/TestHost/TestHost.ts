import { IEnvironment } from '../Environment/IEnvironment';
import { ICommunicationManager, MessageReceivedEventArgs } from '../Environment/ICommunicationManager';
import { Exception, ExceptionType } from '../Exceptions/Exception';
import { MessageType } from '../ObjectModel/MessageType';
import { Message } from '../ObjectModel/Message';
import { TestRunCriteriaWithSources } from '../ObjectModel/Payloads/TestRunCriteriaWithSources';
import { JobQueue } from '../Utils/JobQueue';
import { TestRunner } from './TestRunner';
import { DiscoveryCriteria } from '../ObjectModel/Payloads/DiscoveryCriteria';

const ipRegex = /^(?!.*\.$)((?!0\d)(1?\d?\d|25[0-5]|2[0-4]\d)(\.|$)){4}$/;

export class TestHost {
    private environment: IEnvironment;
    private communicationManager: ICommunicationManager;
    private highestSupportedProcolVersion: number = 2;
    private jobQueue: JobQueue;
    private testRunner: TestRunner;
    private sessionEnded: boolean;

    constructor(environment: IEnvironment) {
        this.environment = environment;
        this.communicationManager = environment.createCommunicationManager();
        this.jobQueue = new JobQueue();
        this.validateArguments(this.environment.argv);
        this.testRunner = new TestRunner(environment, this.communicationManager);
        this.sessionEnded = false;
        this.initializeCommunication();
    }

    private initializeCommunication() {
        this.communicationManager.onMessageReceived.subscribe(this.messageReceived);
        this.communicationManager.connectToServer(Number(this.environment.argv[2]), '127.0.0.1', this.onSocketConnected);
        this.waitForSessionEnd();
    }

    private waitForSessionEnd() {
        if (!this.sessionEnded) {
            // decrease this.endtimeout = ; cleartimeout
            setTimeout(this.waitForSessionEnd.bind(this), 1000);
        }
    }

    private messageReceived = (sender: object, args: MessageReceivedEventArgs) => {
        const message = args.Message;

        console.log('Message Received', message);

        switch (message.messageType) {
            case MessageType.VersionCheck:
                const versionCheckMessage = new Message(MessageType.VersionCheck, this.highestSupportedProcolVersion);
                this.communicationManager.sendMessage(versionCheckMessage);
                break;

            case MessageType.StartTestExecutionWithSources:
                const payload = <TestRunCriteriaWithSources>message.payload;

                this.jobQueue.queuePromise(this.testRunner.startTestRunWithSources(payload));
                break;

            case MessageType.StartDiscovery:
                const discoveryPayload = <DiscoveryCriteria>message.payload;

                this.jobQueue.queuePromise(this.testRunner.discoverTests(discoveryPayload));
                break;

            case MessageType.SessionEnd:
                this.sessionEnded = true;
        }
    }

    private onSocketConnected() {
        console.log('socket connected');
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