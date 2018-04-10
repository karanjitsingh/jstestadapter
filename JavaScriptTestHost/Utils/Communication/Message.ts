import MessageType from "./MessageType";
import {default as Exception, ExceptionType} from "../../Exceptions/Exception";

export default class Message {
    public MessageType: MessageType;
    public Payload;
    public Version?: number;

    constructor(messageType: MessageType, payload, version?:number) {
        if(version) {
            this.Version = version;
        }

        this.MessageType = messageType;
        this.Payload = payload;
    }

    public static FromJSON(json : JSON): Message {
        let messageType : MessageType;
        let version = null;

        if(!json['MessageType']) {
            throw new Exception("Message type was not provided.", ExceptionType.InvalidMessageException);
        }

        if(Object.keys(MessageType).map(key => MessageType[key]).indexOf(json['MessageType']) == -1) {
            throw new Exception("Unknown message type \'" + json['MessageType'] + "\'.", ExceptionType.InvalidMessageException);
        }
        
        messageType = <MessageType>json['MessageType'];

        if(json['Version']) {
            version = json['Version'];
        }

        return new Message(messageType, json['Payload'], version);
    }
}