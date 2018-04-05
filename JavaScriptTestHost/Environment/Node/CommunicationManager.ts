import ICommunicationManager, { MessageReceivedEventArgs } from "../../CommunicationUtils/ICommunicationManager"
import Message from "../../CommunicationUtils/Message";
import {default as Exception, ExceptionType} from "../../Exceptions/Exception";
import IEnvironment from "../IEnvironment";
import Event, { IEventArgs } from "../../Events/Event";

interface PacketData<T> {
    byteCount: number;
    dataObject: T;
}

export default class CommunicationManager implements ICommunicationManager {
    private socket;
    private environment: IEnvironment;
    public onMessageReceived: Event<MessageReceivedEventArgs>;
    private socketBuffer: Buffer;

    constructor(environment: IEnvironment) {
        let net = require("net");

        this.socket = new net.Socket();
        this.socketBuffer = new Buffer(0);
        this.onMessageReceived = environment.createEvent();
        this.socket.on('data', this.onSocketDataReceived);
    }

    public ConnectToServer(port: number, ip:string, callback: () => void) {
        this.socket.connect(port, ip, callback);
    }

    private onSocketDataReceived = (buffer: Buffer) => {
        this.socketBuffer = Buffer.concat([this.socketBuffer, buffer]);
        let messagePacket: PacketData<Message>;        

        do {
            if(messagePacket != null) {
                this.socketBuffer = this.socketBuffer.slice(messagePacket.byteCount, this.socketBuffer.length);

                if(messagePacket.dataObject != null) {
                    this.onMessageReceived.raise(this, <MessageReceivedEventArgs> {
                        Message: messagePacket.dataObject
                    })
                }
            }
            messagePacket = this.TryReadMessage(this.socketBuffer);
        } while(messagePacket != null);
        
    }

    public onConnectionClose(callback: () => {}) {
        this.socket.on('close', callback);
    }

    public SendMessage(message: Message) {
        let dataObject = JSON.stringify(message);

        // 7 bit encoded int length padding
        dataObject = this.IntTo7BitEncodedInt(dataObject.length) + dataObject;

        this.socket.write(dataObject, "binary");
    }

    private TryReadMessage(buffer: Buffer): PacketData<Message> {

        let encodedInt: PacketData<number>
        encodedInt = this.Read7BitEncodedInt(buffer);
        let messagePacket = <PacketData<Message>> {
            byteCount: 0,
            dataObject: null
        }

        if(encodedInt) {
            if(buffer.length >= encodedInt.byteCount + encodedInt.dataObject) {
                let rawMessage = buffer.toString('utf8', encodedInt.byteCount, encodedInt.byteCount + encodedInt.dataObject);
                messagePacket.byteCount = encodedInt.byteCount + encodedInt.dataObject;
                
                try {
                    let messageJson = JSON.parse(rawMessage);
                    messagePacket.dataObject = Message.FromJSON(messageJson);
                }
                catch(e) {
                    // log problem
                    // return packet with null message
                }

                return messagePacket;
            }
        }

        return null;
    }

    // Will return non-negative integer if read was successful
    private Read7BitEncodedInt(buffer: Buffer): PacketData<number> {
        let length:number = 0;

        // max 32bit integer + one extra byte since 32 bit integer encoded in integer can take upto 36 bits
        for(let i=0;i<5;i++) {
            
            if(buffer.length < i+1)
                break;
            
            var byte = buffer.readUInt8(i);

            length += (byte % 128) << 7 * i;

            if(byte < 128) {
                return {
                    byteCount: i+1,
                    dataObject: length
                };
            }
        }

        return null;
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