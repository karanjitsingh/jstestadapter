
import { Exception, ExceptionType } from '../../Exceptions';
import { EnvironmentType, IEvent, IEventArgs } from '../../ObjectModel/Common';
import { IDebugLogger } from '../../ObjectModel/EqtTrace';
import { ICommunicationManager } from '../ICommunicationManager';
import { IEnvironment } from '../IEnvironment';

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

    public getTempDirectory() {
        return null;
    }
}