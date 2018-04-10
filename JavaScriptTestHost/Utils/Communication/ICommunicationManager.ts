import Message from "./Message";
import Event, { IEventArgs } from "../../Events/Event";

export interface MessageReceivedEventArgs extends IEventArgs {
    Message: Message;
}

export default interface ICommunicationManager {
    onMessageReceived: Event<MessageReceivedEventArgs>;
    
    ConnectToServer(port: number, ip:string, callback: () => void);
    onConnectionClose(callback: () => {});
    SendMessage(message: Message);
}