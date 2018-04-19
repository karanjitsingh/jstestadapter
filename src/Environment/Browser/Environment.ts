
import { IEnvironment, EnvironmentType} from '../IEnvironment';
import { ICommunicationManager } from '../../Utils/ICommunicationManager';
import { IEventDispatcher } from '../../Events/IEventDispatcher';
import { Exception, ExceptionType } from '../../Exceptions/Exception';
import { Event } from '../../Events/Event';

export class Environment implements IEnvironment {
    public readonly environmentType: EnvironmentType = EnvironmentType.NodeJS;
    public argv: Array<string>;
    public readonly eventDispatcher: IEventDispatcher;

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