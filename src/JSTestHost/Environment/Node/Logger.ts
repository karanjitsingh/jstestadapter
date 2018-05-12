import { BaseLogger } from '../BaseLogger';
import { ICommunicationManager } from '../ICommunicationManager';
import debug from 'debug';

export class Logger extends BaseLogger {
    constructor(commManager: ICommunicationManager) {
        super(commManager);
    }

    protected debugTrace() {
        const debugTrace = debug('JSTest');
        debugTrace('booting %s', name);
    }
}