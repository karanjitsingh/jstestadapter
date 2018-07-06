
import { EnvironmentType, IEvent, IEventArgs } from '../../ObjectModel/Common';
import { IEnvironment } from '../IEnvironment';
import { ICommunicationManager } from '../ICommunicationManager';
import { Exception, ExceptionType } from '../../Exceptions';
import { IDebugLogger } from '../../ObjectModel/EqtTrace';

export class Environment implements IEnvironment {
    public readonly environmentType: EnvironmentType = EnvironmentType.Browser;
    public argv: Array<string>;

    constructor() {
        return;
    }

    public getDebugLogger(): IDebugLogger {
        throw new Exception('Not implemented', ExceptionType.NotImplementedException);
    }

    public getCommunicationManager(): ICommunicationManager {
        throw new Exception('Not implemented', ExceptionType.NotImplementedException);
    }

    public createEvent<T extends IEventArgs>(): IEvent<T> {
        throw new Exception('Not implemented', ExceptionType.NotImplementedException);
    }

    public exit(exitCode: number) {
        throw new Exception('Not implemented', ExceptionType.NotImplementedException);
    }

    public setupGlobalLogger() {
        throw new Exception('Not implemented', ExceptionType.NotImplementedException);
    }

    public reinitializeConsoleLogger() {
        throw new Exception('Not implemented', ExceptionType.NotImplementedException);
    }
}