
import { EnvironmentType } from '../../ObjectModel/Common';
import { IEnvironment } from '../IEnvironment';
import { ICommunicationManager } from '../ICommunicationManager';
import { Exception, ExceptionType } from '../../Exceptions/Exception';
import { Event } from '../../Events/Event';

export class Environment implements IEnvironment {
    public readonly environmentType: EnvironmentType = EnvironmentType.Browser;
    public argv: Array<string>;

    constructor() {
        return;
    }

    public createCommunicationManager(): ICommunicationManager {
        throw new Exception('Not implemented', ExceptionType.NotImplementedException);
    }

    public createEvent<T>(): Event<T> {
        throw new Exception('Not implemented', ExceptionType.NotImplementedException);
    }
}