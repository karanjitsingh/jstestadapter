import { BaseLogger } from '../BaseLogger';
import { ICommunicationManager } from '../ICommunicationManager';
import { IDebugLogger } from '../../ObjectModel/EqtTrace';
import debug from 'debug';

class DebugLogger implements IDebugLogger {
    private debugMethod: (message: string, moduleName: string) => void;

    constructor() {
        this.debugMethod = debug('JSTest');
    }

    public log(message: string, moduleName: string) {
        this.debugMethod(message, moduleName);
    }
}

export class Logger extends BaseLogger {
    constructor(commManager: ICommunicationManager) {        
        super(commManager, new DebugLogger());
    }
}