interface ICSharpException {
    ClassName: string;
    Message: string;
    Data: any;
    InnerException: any;
    HelpURL: any;
    StackTraceString: string;
    RemoteStackTraceString: any;
    RemoteStackIndex: number;
    ExceptionMethod: any;
    HResult: number;
    Source: string;
    WatsonBuckets: any;
}

export class CSharpException implements ICSharpException {

    // Variable names must match with ones in c#
    // tslint:disable: variable-name
    public readonly ClassName: string = 'System.Exception';
    public readonly Message: string;
    public readonly Data: any = null;
    public readonly InnerException: any = null;
    public readonly HelpURL: any = null;
    public readonly StackTraceString: string;
    public readonly RemoteStackTraceString: any = null;
    public readonly RemoteStackIndex: number = 0;
    public readonly ExceptionMethod: any = null;
    public readonly HResult: number = -2147023895;
    public readonly Source: string = null;
    public readonly WatsonBuckets: any = null;

    constructor(err: Error, source?: string) {
        this.Source = source ? source : null;
        this.Message = err.message;
        this.StackTraceString = err.stack;
    }
}