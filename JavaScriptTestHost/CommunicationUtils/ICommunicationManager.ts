import Message from "./Message";

export default interface ICommunicationManager {
    ConnectToServer(port: number, ip:string, callback: () => void);
    onMessageReceived(callback: (data: Message) => void);
    onConnectionClose(callback: () => {});
    SendMessage(message: Message);
}