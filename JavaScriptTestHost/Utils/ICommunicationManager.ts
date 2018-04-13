import Message from "../ObjectModel/Message";
import Event, { IEventArgs } from "../Events/Event";

export interface MessageReceivedEventArgs extends IEventArgs {
    Message: Message;
}

export default interface ICommunicationManager {
    onMessageReceived: Event<MessageReceivedEventArgs>;
    
    ConnectToServer(port: number, ip:string, callback: () => void);
    SendMessage(message: Message);
}