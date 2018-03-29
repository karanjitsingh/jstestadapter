import Message from "./Message";
import Event from "Events/Event";

export default interface ICommunicationManager {
    onMessageReceived: Event;
    
    ConnectToServer(port: number, ip:string, callback: () => void);
    onConnectionClose(callback: () => {});
    SendMessage(message: Message);
}