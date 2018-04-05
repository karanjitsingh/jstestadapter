export enum ExceptionType {
    InvalidArgumentsException,
    InvalidMessageException,
    InvalidJSONException,
    UnknownException
}

export default class Exception extends Error {
    constructor(message: string, type:ExceptionType) {
        let exceptionType:string = typeof(ExceptionType[type]);

        if(exceptionType == "undefined") {
            exceptionType = ExceptionType[ExceptionType.UnknownException]
        }
        else {
            exceptionType = ExceptionType[type]
        }

        super(exceptionType + ": " + message);
    }
}