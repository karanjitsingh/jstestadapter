import { EnvironmentType, IEvent, IEventArgs } from '../ObjectModel/Common';
import { IDebugLogger } from '../ObjectModel/EqtTrace';
import { ICommunicationManager } from './ICommunicationManager';

export interface IEnvironment {
    readonly environmentType: EnvironmentType;
    readonly argv: Array<string>;
    getDebugLogger(): IDebugLogger;
    getCommunicationManager(): ICommunicationManager;
    
    // In case temp directory can't be accessed, for example in browsers, them return null
    getTempDirectory(): string | null;
    createEvent<T extends IEventArgs>(): IEvent<T>;
    exit(exitCode: number);
}