import { Message, TestMessageLevel, MessageType } from '../../ObjectModel';
import { IEvent } from '../../ObjectModel/Common';
import { TestMessagePayload } from '../../ObjectModel/Payloads';
import { ICommunicationManager, MessageReceivedEventArgs } from '../ICommunicationManager';
import { IEnvironment } from '../IEnvironment';
import * as wait from 'wait-for-stuff';
// import { TestMessagePayload } from 'ObjectModel/TPPayloads';

interface PacketData<T> {
    byteCount: number;
    dataObject: T;
}

export class CommunicationManager implements ICommunicationManager {
    private socketBuffer: Buffer;

    public onMessageReceived: IEvent<MessageReceivedEventArgs>;
    private con: any;

    constructor(environment: IEnvironment) {
        this.socketBuffer = new Buffer(0);

        this.con = console.log;

        ['log', 'warn', 'error'].forEach((method) => {
            // const oldMethod = console[method].bind(console);
            // tslint:disable-next-line
            console[method] = function() {
                // oldMethod.apply(
                //     console,
                //     [new Date().toISOString()].concat(arguments)
                // );
                this.logMessage(method, arguments);
            }.bind(this);
        });

        this.onMessageReceived = environment.createEvent();
        process.stdin.on('data', this.stdinDataReceived);
    }

    public sendMessage(message: Message, log: boolean = true) {
        let dataObject = JSON.stringify(message);

        if (log) {
            console.log('Message Send', message);
        }

        // Left pad with 7 bit encoded int length
        dataObject = this.intTo7BitEncodedInt(dataObject.length) + dataObject;

        // this.con(dataObject);
        const x = process.stdout.write(dataObject, 'binary');
    }

    // tslint:disable-next-line
    public receiveMessageSync(): Message {
        let messageReceived: boolean = false;
        let message: Message = null;
        const messageCallback = (sender: Object, args: MessageReceivedEventArgs) => {
            messageReceived = true;
            message = args.Message;
        };

        this.onMessageReceived.subscribe(messageCallback);

        wait.for.predicate(() => messageReceived);

        this.onMessageReceived.unsubscribe(messageCallback);
        return message;
    }

    private stdinDataReceived = (buffer: Buffer) => {
        this.socketBuffer = Buffer.concat([this.socketBuffer, buffer]);
        let messagePacket: PacketData<Message> = null;

        do {
            if (messagePacket != null) {
                this.socketBuffer = this.socketBuffer.slice(messagePacket.byteCount, this.socketBuffer.length);

                if (messagePacket.dataObject != null) {
                    this.onMessageReceived.raise(this, <MessageReceivedEventArgs> {
                        Message: messagePacket.dataObject
                    });
                }
            }
            messagePacket = this.tryReadMessage(this.socketBuffer);
        } while (messagePacket != null);

    }

    private tryReadMessage(buffer: Buffer): PacketData<Message> {

        let encodedInt: PacketData<number>;
        encodedInt = this.read7BitEncodedInt(buffer);
        const messagePacket = <PacketData<Message>> {
            byteCount: 0,
            dataObject: null
        };

        if (encodedInt) {
            if (buffer.length >= encodedInt.byteCount + encodedInt.dataObject) {
                const rawMessage = buffer.toString('utf8', encodedInt.byteCount, encodedInt.byteCount + encodedInt.dataObject);
                messagePacket.byteCount = encodedInt.byteCount + encodedInt.dataObject;

                try {
                    const messageJson = JSON.parse(rawMessage);
                    messagePacket.dataObject = Message.FROM_JSON(messageJson);
                } catch (e) {
                    // log problem
                    messagePacket.dataObject = null;
                }

                return messagePacket;
            }
        }

        return null;
    }

    // Will return non-negative integer if read was successful
    private read7BitEncodedInt(buffer: Buffer): PacketData<number> {
        let length: number = 0;

        // Max 32bit integer + one extra byte since 32 bit integer encoded in integer can take upto 36 bits
        for (let i = 0; i < 5; i++) {

            if (buffer.length < i + 1) {
                break;
            }

            const byte = buffer.readUInt8(i);

            // tslint:disable-next-line
            length += (byte % 128) << 7 * i;

            if (byte < 128) {
                return {
                    byteCount: i + 1,
                    dataObject: length
                };
            }
        }

        return null;
    }

    private intTo7BitEncodedInt(integer: number): string {
        let output = '';
        let length = integer;
        let byte;

        while (length > 0) {
            byte = length % 128;                // will give the 7 least significant bits
            byte += length >= 128 ? 128 : 0;    // will set highest bit to 1 if more bits required

            output += String.fromCharCode(byte);
            
            // tslint:disable-next-line
            length = length >> 7;
        }
        return output;
    }

    // For some reason this is a false positive
    // tslint:disable:no-unused-variable
    private logMessage(method: string, args: Array<any>): void {
        if (!args || !args.length) {
            return;
        }

        args = Array.from(args);

        let messageLevel = TestMessageLevel.Informational;

        switch (method) {
            case 'log':
                messageLevel = TestMessageLevel.Informational;
                break;
            case 'warn':
                messageLevel = TestMessageLevel.Warning;
                break;
            case 'error':
                messageLevel = TestMessageLevel.Error;
                break;
        }

        args.forEach((arg, i) => {
            args[i] = JSON.stringify(arg);
        });
        
        const messageString = args.join('\n');

        const message = new Message(MessageType.TestMessage, <TestMessagePayload> {
            Message: messageString,
            MessageLevel: messageLevel
        });

        this.sendMessage(message, false);
    }
}