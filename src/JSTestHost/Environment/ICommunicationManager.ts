import { Message } from '../ObjectModel';
import { IEvent, IEventArgs } from '../ObjectModel/Common';

export interface MessageReceivedEventArgs extends IEventArgs {
    Message: Message;
}

export interface ICommunicationManager {
    onMessageReceived: IEvent<MessageReceivedEventArgs>;

    connectToServer(port: number, ip: string, callback: () => void);
    sendMessage(message: Message);
}