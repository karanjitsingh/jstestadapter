
import { EnvironmentType, IEvent } from '../../ObjectModel/Common';
import { IEnvironment } from '../IEnvironment';
import { ICommunicationManager } from '../ICommunicationManager';
import { Exception, ExceptionType } from '../../Exceptions/Exception';
import { IXmlParser } from '../IXmlParser';

export class Environment implements IEnvironment {
    public readonly environmentType: EnvironmentType = EnvironmentType.Browser;
    public argv: Array<string>;

    constructor() {
        return;
    }

    public createCommunicationManager(): ICommunicationManager {
        throw new Exception('Not implemented', ExceptionType.NotImplementedException);
    }

    public createEvent<T>(): IEvent<T> {
        throw new Exception('Not implemented', ExceptionType.NotImplementedException);
    }

    public getXmlParser(): IXmlParser {
        throw new Exception('Not implemented', ExceptionType.NotImplementedException);
        
    }
}