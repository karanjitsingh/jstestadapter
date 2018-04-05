import {IEnvironment} from "../Environment"
import ICommunicationManager, { MessageReceivedEventArgs } from "../CommunicationUtils/ICommunicationManager";
import {default as Exception, ExceptionType} from "../Exceptions/Exception";
import MessageType from "../CommunicationUtils/MessageType";
import Message from "../CommunicationUtils/Message"
import TestRunCriteriaWithSources from "../ObjectModel/TestRunCriteriaWithSources";


const ipRegex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

export default class TestHost {
    private environment:IEnvironment;
    private communicationManager: ICommunicationManager;

    constructor(environment: IEnvironment) {
        this.environment = environment;
        this.communicationManager = environment.createCommunicationManager();
        this.validateArguments(this.environment.argv);
    }
    
    public setupCommunication() {
        this.communicationManager.onMessageReceived.subscribe(this.messageReceived);
        this.communicationManager.ConnectToServer(Number(this.environment.argv[2]), "127.0.0.1", this.onSocketConnected);
    }

    private messageReceived = (sender: object, args: MessageReceivedEventArgs) => {
        let message = args.Message;
        
        console.log(message);

        if(message.MessageType == MessageType.VersionCheck && message.Payload == "2") {
            this.communicationManager.SendMessage(message);
        }

        if(message.MessageType == MessageType.StartTestExecutionWithSources) {
            let payload: TestRunCriteriaWithSources = JSON.parse(message.Payload)
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