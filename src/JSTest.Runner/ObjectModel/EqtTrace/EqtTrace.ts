import { IDebugLogger } from './IDebugLogger';

export namespace EqtTrace {
    let logger: IDebugLogger;
    let loggerInitialized: boolean = false;
    
    const writeLog = (prefix: string, message: string) => {
        if (loggerInitialized) {
            logger.log(`${prefix}: ${message}`);
        }
    };

    export const initialize = (debugLogger: IDebugLogger) => {
        if (debugLogger) {
            loggerInitialized = true;
            logger = debugLogger;
        }
    };

    export const error = (message: string) => {
        writeLog('Error', message);
    };
    
    export const info = (message: string) => {
        writeLog('Informational', message);
    };
    
    export const warn = (message: string) => {
        writeLog('Warning', message);
    };

    export const verbose = (message: string) => {
        writeLog('Verbose', message);
    };
}