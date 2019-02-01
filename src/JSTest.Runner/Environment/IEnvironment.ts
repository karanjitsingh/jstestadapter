import { EnvironmentType, IEvent, IEventArgs } from '../ObjectModel/Common';
import { ICommunicationManager } from './ICommunicationManager';
import { IDebugLogger } from '../ObjectModel/EqtTrace';

export interface IEnvironment {
    readonly environmentType: EnvironmentType;
    readonly argv: Array<string>;
    getDebugLogger(): IDebugLogger;
    getCommunicationManager(): ICommunicationManager;
    getTempDirectory(): string;
    createEvent<T extends IEventArgs>(): IEvent<T>;
    exit(exitCode: number);
}