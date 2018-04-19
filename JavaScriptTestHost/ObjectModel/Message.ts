import { MessageType } from './MessageType';
import { Exception, ExceptionType} from '../Exceptions/Exception';

export class Message {
    public messageType: MessageType;
    public payload: any;
    public version?: number;

    constructor(messageType: MessageType, payload: any, version?: number) {
        if (version) {
            this.version = version;
        }

        this.messageType = messageType;
        this.payload = payload;
    }

    public static FROM_JSON(messageJSON : JSON): Message {
        let messageType : MessageType;
        let version = null;

        const json = <any>messageJSON;

        if (!json.MessageType) {
            throw new Exception('Message type was not provided.', ExceptionType.InvalidMessageException);
        }

        if (Object.keys(MessageType).map(key => MessageType[key]).indexOf(json.MessageType) === -1) {
            throw new Exception('Unknown message type \'' + json.MessageType + '\'.', ExceptionType.InvalidMessageException);
        }

        messageType = <MessageType>json.MessageType;

        if (json.Version) {
            version = json.Version;
        }

        return new Message(messageType, json.Payload, version);
    }
}