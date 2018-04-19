export enum ExceptionType {
    InvalidArgumentsException,
    InvalidMessageException,
    InvalidJSONException,
    NotImplementedException,
    UnknownException
}

export class Exception extends Error {
    constructor(message: string, exceptionType: ExceptionType) {
        let exception: string = typeof(ExceptionType[exceptionType]);

        if (exception === 'undefined') {
            exception = ExceptionType[ExceptionType.UnknownException];
        } else {
            exception = ExceptionType[exceptionType];
        }

        super(exceptionType + ': ' + message);
    }
}