export interface ILogger {
    initializeLogger(): void;
    debugTrace(...args: Array<string>);
}