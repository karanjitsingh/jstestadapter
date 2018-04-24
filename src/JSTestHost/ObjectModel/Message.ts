import { MessageType } from './MessageType';
import { Exception, ExceptionType} from '../Exceptions/Exception';

export class Message {
    /* These variables serialize to a JSON that will be deserialized
     * to the same object in TestPlatform hence their names must match */
    // tslint:disable:variable-name
    public MessageType: MessageType;
    public Payload: any;
    public Version?: number;
    // tslint:enable:variable-name

    constructor(messageType: MessageType, payload: any, version?: number) {
        if (version) {
            this.Version = version;
        }

        this.MessageType = messageType;
        this.Payload = payload;
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