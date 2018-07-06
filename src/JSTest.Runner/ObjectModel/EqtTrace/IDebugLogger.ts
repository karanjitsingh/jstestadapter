export interface IDebugLogger {
    readonly processPid: number;
    log(message: string);
}