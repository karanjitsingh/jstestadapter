import { IDebugLogger } from './IDebugLogger';
import { GetTimeStamp } from '../../Utils/TimeUtils';

export namespace EqtTrace {
    let logger: IDebugLogger;
    let loggingEnabled: boolean;
    
    const writeLog = (prefix: string, message: string) => {
        if (loggingEnabled) {
            const [dateStamp, timeStamp] = GetTimeStamp('/', ':');
            logger.log(`${prefix}: ${logger.processPid}, ${dateStamp}, ${timeStamp}, ${message}`);
        }
    };

    export const initialize = (debugLogger: IDebugLogger, diagFile: string) => {
        if (debugLogger) {
            logger = debugLogger;
            debugLogger.initialize(diagFile);
            loggingEnabled = true;
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