import { BaseLogger } from '../BaseLogger';
import { ICommunicationManager } from '../ICommunicationManager';
import { IDebugLogger } from '../../ObjectModel/EqtTrace';
import debug from 'debug';
import { IEnvironment } from '../IEnvironment';

class DebugLogger implements IDebugLogger {
    private debugMethod: (message: string, moduleName: string) => void;

    constructor() {
        this.debugMethod = debug('JSTest');
    }

    public log(message: string, moduleName: string) {
        this.debugMethod(message, moduleName);
        // TODO FIX where is this log eventually saved?
    }
}

export class Logger extends BaseLogger {
    constructor(env: IEnvironment) {
        super(env.getCommunicationManager(), new DebugLogger());
    }
}