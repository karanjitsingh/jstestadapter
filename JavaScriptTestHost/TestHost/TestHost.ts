import {IEnvironment} from "../Environment"
import ICommunicationManager, { MessageReceivedEventArgs } from "../Utils/ICommunicationManager";
import {default as Exception, ExceptionType} from "../Exceptions/Exception";
import MessageType from "../ObjectModel/MessageType";
import Message from "../ObjectModel/Message"
import TestRunCriteriaWithSources from "../ObjectModel/TestRunCriteriaWithSources";
import JobQueue from "../Utils/JobQueue";
import TestRunner from "./TestRunner";

const ipRegex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

export default class TestHost {
    private environment:IEnvironment;
    private communicationManager: ICommunicationManager;
    private highestSupportedProcolVersion = 2;
    private jobQueue: JobQueue;
    private testRunner: TestRunner;

    constructor(environment: IEnvironment) {
        this.environment = environment;
        this.communicationManager = environment.createCommunicationManager();
        this.jobQueue = new JobQueue();
        this.validateArguments(this.environment.argv);
        this.testRunner = new TestRunner(environment, this.communicationManager);
    }
    
    public setupCommunication() {
        debugger;
        this.communicationManager.onMessageReceived.subscribe(this.messageReceived);
        this.communicationManager.ConnectToServer(Number(this.environment.argv[2]), "127.0.0.1", this.onSocketConnected);
    }

    private messageReceived = (sender: object, args: MessageReceivedEventArgs) => {
        let message = args.Message;
        
        console.log("Message Received", message);

        switch(message.MessageType) {
            case MessageType.VersionCheck:
                let versionCheckMessage = new Message(MessageType.VersionCheck, this.highestSupportedProcolVersion);
                this.communicationManager.SendMessage(versionCheckMessage);
                break;
            
            case MessageType.StartTestExecutionWithSources:
                let payload: TestRunCriteriaWithSources = <TestRunCriteriaWithSources>message.Payload;

                this.jobQueue.QueueJob(() => {
                    this.testRunner.StartTestRunWithSources(payload)
                });
                break;
        }
    };

    private onSocketConnected() {
        console.log("socket connected");
    }

    private validateArguments(args: Array<string>) {
        if(isNaN(Number(args[2]))) {
            throw new Exception("Invalid Port.", ExceptionType.InvalidArgumentsException);
        }

        if(typeof(args[3]) === 'undefined' || args[3].match(ipRegex)) {
            throw new Exception("Invalid IP.", ExceptionType.InvalidArgumentsException);
        }
    }
}