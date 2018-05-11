import { EnvironmentType, IEvent, IEventArgs } from '../ObjectModel/Common';
import { ICommunicationManager } from './ICommunicationManager';
import { IXmlParser } from './IXmlParser';
import { TestMessageLevel, MessageType, Message } from '../ObjectModel';
import { TestMessagePayload } from 'ObjectModel/Payloads';
import { IEventDispatcher } from 'Events/IEventDispatcher';
import { EventDispatcher } from './Node/EventDispatcher';

export abstract class BaseEnvironment implements IEnvironment {
    public abstract readonly environmentType: EnvironmentType;

    public argv: Array<string>;
    private eventDispatcher: IEventDispatcher;
    private communicationManager: ICommunicationManager;
    private eventConstructor: any;

    protected initialize(communicationManager: ICommunicationManager,
                eventDispatcher: EventDispatcher,
                argv: Array<string>,
                eventConstructor: any) {
        this.communicationManager = communicationManager;
        this.eventDispatcher = eventDispatcher;
        this.argv = Array.from(argv);
        this.eventConstructor = eventConstructor;
        this.overrideLogging();
    }

    protected abstract debugMessage(...args: Array<string>);

    public getCommunicationManager(): ICommunicationManager {
        return this.communicationManager;
    }

    public createEvent<T extends IEventArgs>(): IEvent<T> {
        return <IEvent<T>>(new this.eventConstructor(this.eventDispatcher));
    }


    
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
            if (typeof(args[i]) !== 'string') {
                args[i] = JSON.stringify(arg);
            }
        });
        
        const messageString = args.join('\n');

        const message = new Message(MessageType.TestMessage, <TestMessagePayload> {
            Message: messageString,
            MessageLevel: messageLevel
        });

        this.communicationManager.sendMessage(message);
    }

}

export interface IEnvironment {
    readonly environmentType: EnvironmentType;
    readonly argv: Array<string>;
    getCommunicationManager(): ICommunicationManager;
    createEvent<T>(): IEvent<T>;
}