import { Constants } from '../Constants';
import { ICommunicationManager, MessageReceivedEventArgs } from '../Environment/ICommunicationManager';
import { IEnvironment } from '../Environment/IEnvironment';
import { JSTestSettings, MessageType } from '../ObjectModel';
import { EqtTrace } from '../ObjectModel/EqtTrace';
import { StartDiscoveryPayload, StartExecutionWithSourcesPayload, StartExecutionWithTestsPayload } from '../ObjectModel/Payloads';
import { JobQueue } from '../Utils/JobQueue';
import { CLIArgs } from './CLIArgs';
import { DiscoveryManager, ExecutionManager } from './ExecutionManagers';
import { TestSessionManager } from './ExecutionManagers/TestSessionManager';
import { MessageSender } from './MessageSender';
import { TestFrameworkFactory } from './TestFrameworks/TestFrameworkFactory';

export class TestRunner {
    private readonly environment: IEnvironment;
    private readonly communicationManager: ICommunicationManager;
    private readonly jobQueue: JobQueue;
    private readonly messageSender: MessageSender;
    private readonly cliArgs: CLIArgs;

    private jsTestSettings: JSTestSettings;
    private sessionEnded: boolean;

    constructor(environment: IEnvironment, args: CLIArgs) {
        this.environment = environment;
        this.sessionEnded = false;
        this.jobQueue = new JobQueue();
        this.cliArgs = args;

        this.communicationManager = environment.getCommunicationManager();
        this.messageSender = new MessageSender(this.communicationManager);

        this.initializeCommunication();
    }

    private initializeCommunication() {
        EqtTrace.info('TestRunner: Initializing communication.');

        this.communicationManager.onMessageReceived.subscribe(this.messageReceived);
        this.communicationManager.connectToServer(this.cliArgs.ip, this.cliArgs.port, (...args) => {
            EqtTrace.info('TestRunner: Communication initialized.');
        });
        this.waitForSessionEnd();
    }

    private waitForSessionEnd() {
        if (!this.sessionEnded) {
            setTimeout(this.waitForSessionEnd.bind(this), 1000);
            return;
        }

        EqtTrace.info('TestRunner: completed session wait.');
    }

    private messageReceived = (sender: object, args: MessageReceivedEventArgs) => {
        const message = args.Message;
        switch (message.MessageType) {

            case MessageType.TestRunSettings:
                if (message.Version === Constants.MessageProtocolVersion) {
                    this.jsTestSettings = new JSTestSettings(message.Payload, this.environment.getTempDirectory());
                } else {
                    EqtTrace.error(`TestRunner: Message protocol version mismatch, version is` + 
                                   ` ${Constants.MessageProtocolVersion}, provided was ${message.Version}`, null);            
                }

                this.messageSender.sendVersionCheck();
                break;

            case MessageType.VersionCheck:
                this.messageSender.sendVersionCheck();
                break;

            case MessageType.StartTestExecutionWithSources:
                EqtTrace.info('TestRunner: Starting execution with sources');
                this.initializeSingletons();

                const executionManager = new ExecutionManager(this.environment, this.messageSender, this.jsTestSettings);
                const runWithSourcesPayload = <StartExecutionWithSourcesPayload>message.Payload;

                this.jobQueue.queuePromise(executionManager.startTestRunWithSources(runWithSourcesPayload.Sources));
                break;

            case MessageType.StartTestExecutionWithTests:
                EqtTrace.info('TestRunner: Starting execution with tests');
                this.initializeSingletons();

                const executionManager2 = new ExecutionManager(this.environment, this.messageSender, this.jsTestSettings);
                const runWithTestsPayload = <StartExecutionWithTestsPayload>message.Payload;

                this.jobQueue.queuePromise(executionManager2.startTestRunWithTests(runWithTestsPayload.Tests));
                break;

            case MessageType.StartDiscovery:
                EqtTrace.info('TestRunner: Starting discovery');
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