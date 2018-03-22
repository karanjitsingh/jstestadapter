export declare enum ExceptionType {
    InvalidArgumentsException,
    UnknownException
}

export default class Exception extends Error {
    constructor(message: string, type:ExceptionType) {
        let exceptionType:string = typeof(ExceptionType[type]);
        if(exceptionType == "undefined") {
            exceptionType = typeof(ExceptionType[ExceptionType.UnknownException])
        }
        super(exceptionType + ": " + message);
    }
}