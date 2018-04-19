/**
 * This is a description of the foo function.
 * */

import { Message } from '../ObjectModel/Message';
import { Event, IEventArgs } from '../Events/Event';

export interface MessageReceivedEventArgs extends IEventArgs {
    Message: Message;
}

export interface ICommunicationManager {
    onMessageReceived: Event<MessageReceivedEventArgs>;

    connectToServer(port: number, ip: string, callback: () => void);
    sendMessage(message: Message);
}