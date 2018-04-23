import { Message } from '../ObjectModel';
import { Event, IEventArgs } from '../Events/Event';

export interface MessageReceivedEventArgs extends IEventArgs {
    Message: Message;
}

export interface ICommunicationManager {
    onMessageReceived: Event<MessageReceivedEventArgs>;

    connectToServer(port: number, ip: string, callback: () => void);
    sendMessage(message: Message);
}