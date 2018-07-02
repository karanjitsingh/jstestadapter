export interface CLIArgs {
    ip: string;
    port: number;
    eqtTraceOptions: EqtTraceOptions;
}

export interface EqtTraceOptions {
    isErrorEnabled: boolean;
    isInfoEnabled: boolean;
    isVerboseEnabled: boolean;
    isWarningEnabled: boolean;
}