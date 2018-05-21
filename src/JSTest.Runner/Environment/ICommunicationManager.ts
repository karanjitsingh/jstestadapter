import { Message } from '../ObjectModel';
import { IEvent, IEventArgs } from '../ObjectModel/Common';

export interface MessageReceivedEventArgs extends IEventArgs {
    Message: Message;
}

export interface ICommunicationManager {
    onMessageReceived: IEvent<MessageReceivedEventArgs>;
    sendMessage(message: Message);
    connectToServer(ip: string, port: number, callback?: () => void);
}