import { EnvironmentType } from '../ObjectModel/Common';
import { ICommunicationManager } from './ICommunicationManager';
import { IEventDispatcher } from '../Events/IEventDispatcher';
import { Event } from '../Events/Event';

export interface IEnvironment {
    readonly environmentType: EnvironmentType;
    readonly argv: Array<string>;
    readonly eventDispatcher: IEventDispatcher;
    createCommunicationManager(): ICommunicationManager;
    createEvent<T>(): Event<T>;
}