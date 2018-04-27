import { EnvironmentType, IEvent } from '../ObjectModel/Common';
import { ICommunicationManager } from './ICommunicationManager';
import { IXmlParser } from './IXmlParser';

export interface IEnvironment {
    readonly environmentType: EnvironmentType;
    readonly argv: Array<string>;
    createCommunicationManager(): ICommunicationManager;
    createEvent<T>(): IEvent<T>;
    createXmlParser(): IXmlParser;
}