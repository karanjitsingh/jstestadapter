import { EnvironmentType, IEvent } from '../ObjectModel/Common';
import { ICommunicationManager } from './ICommunicationManager';
import { IEventDispatcher } from '../Events/IEventDispatcher';

export interface IEnvironment {
    readonly environmentType: EnvironmentType;
    readonly argv: Array<string>;
    readonly eventDispatcher: IEventDispatcher;
    createCommunicationManager(): ICommunicationManager;
    createEvent<T>(): IEvent<T>;
}