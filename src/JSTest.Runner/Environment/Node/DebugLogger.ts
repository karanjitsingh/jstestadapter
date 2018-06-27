import { IDebugLogger } from '../../ObjectModel/EqtTrace';
import debug from 'debug';

export class DebugLogger implements IDebugLogger {
    private debugMethod: (message: string, moduleName: string) => void;

    constructor() {
        this.debugMethod = debug('JSTest');
    }

    public log(message: string, moduleName: string) {
        this.debugMethod(message, moduleName);
        // TODO FIX where is this log eventually saved?
    }
}