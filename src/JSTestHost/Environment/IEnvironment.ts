import { EnvironmentType, IEvent } from '../ObjectModel/Common';
import { ICommunicationManager } from './ICommunicationManager';

export interface IEnvironment {
    readonly environmentType: EnvironmentType;
    readonly argv: Array<string>;
    createCommunicationManager(): ICommunicationManager;
    createEvent<T>(): IEvent<T>;
}