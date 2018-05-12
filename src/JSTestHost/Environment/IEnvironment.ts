import { EnvironmentType, IEvent, IEventArgs } from '../ObjectModel/Common';
import { ICommunicationManager } from './ICommunicationManager';

export interface IEnvironment {
    readonly environmentType: EnvironmentType;
    readonly argv: Array<string>;
    getCommunicationManager(): ICommunicationManager;
    createEvent<T extends IEventArgs>(): IEvent<T>;
    exit(exitCode: number);
}