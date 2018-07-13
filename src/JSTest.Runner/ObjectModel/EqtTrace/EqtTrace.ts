import { IDebugLogger } from './IDebugLogger';

export namespace EqtTrace {
    let logger: IDebugLogger;
    let loggerInitialized: boolean = false;
    
    const writeLog = (prefix: string, message: string) => {
        if (loggerInitialized) {
            const date = new Date();
            const dateStamp = `${date.getFullYear()}/${date.getMonth()}/${date.getDate()}`;
            const timeStamp = `${date.getHours()}:${date.getMinutes()}.${date.getMilliseconds()}`;
            logger.log(`${prefix}: ${logger.processPid}, ${dateStamp}, ${timeStamp}, ${message}`);
        }
    };

    export const initialize = (debugLogger: IDebugLogger) => {
        if (debugLogger) {
            loggerInitialized = true;
            logger = debugLogger;
        }
    };

    export const error = (message: string, error: Error) => {
        if (error !== null) {
            writeLog('Error', `${message} Error: ${error.message}, Stack: ${error.stack}`);
        } else {
            writeLog('Error', message);
        }
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