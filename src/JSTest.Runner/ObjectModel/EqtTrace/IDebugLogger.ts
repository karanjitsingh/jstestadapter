export interface IDebugLogger {
    readonly processPid: number;
    initialize(traceFilePath: string);
    log(message: string);
}