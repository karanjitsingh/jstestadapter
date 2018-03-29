import ICommunicationManager from "../../CommunicationUtils/ICommunicationManager"
import Message from "../../CommunicationUtils/Message";
import {default as Exception, ExceptionType} from "../../Exceptions/Exception";
import IEnvironment from "../IEnvironment";
import Event from "Events/Event";
import BinaryReader from "./BinaryReader"

export default class CommunicationManager implements ICommunicationManager {
    private socket;
    private binaryReader: BinaryReader;
    private onmsg: Event;
    private environment: IEnvironment;
    public onMessageReceived: Event;

    constructor(environment: IEnvironment) {
        let net = require("net");
        this.socket = new net.Socket();
        this.onmsg = environment.createEvent();
        this.socket.on('data', this.onSocketDataReceived);
    }

    public ConnectToServer(port: number, ip:string, callback: () => void) {
        this.socket.connect(port, ip, callback);
    }

    private onSocketDataReceived(buffer: Buffer) {

        // this.readBuffer = Buffer.concat([this.readBuffer, buffer]);
        


        // try {
        //     const match = rawData.match(/.*?({.*}).*/);
        //     if(!match || !match[1]) {
        //         throw new Exception("Invalid message from socket.", ExceptionType.InvalidMessage);
        //     }

        //     let json: JSON;

        //     try {
        //         json = JSON.parse(match[1]);
        //     }
        //     catch(e) {
        //         throw new Exception("Invalid message from socket.", ExceptionType.InvalidMessage);
        //     }

            
        //     callback(Message.FromJSON(json));
        // }
        // catch(e) {

        // }

    }

    public onConnectionClose(callback: () => {}) {
        this.socket.on('close', callback);
    }

    public SendMessage(message: Message) {
        let data = JSON.stringify(message);

        // 7 bit encoded int length padding
        data = this.IntTo7BitEncodedInt(data.length) + data;

        this.socket.write(data, "binary");
    }

   

    private IntTo7BitEncodedInt(integer: number): string {
        let output = "";
        let length = Math.floor(integer);  // just in case
        let byte;

        while(length > 0) {
            byte = length % 128         // will give the 7 least significant bits
            byte += length >= 128 ? 128 : 0  // will set highest bit to 1 if more bits required

            output += String.fromCharCode(byte);
            length = length >> 7;
        }
        return output;
    }

}