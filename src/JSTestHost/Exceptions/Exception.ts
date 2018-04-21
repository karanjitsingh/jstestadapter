import { ISerializable } from '../ObjectModel/ISerializable';
import { CSharpException } from './CSharpException';

export enum ExceptionType {
    InvalidArgumentsException,
    InvalidMessageException,
    InvalidJSONException,
    NotImplementedException,
    UnknownException
}

export class Exception extends Error implements ISerializable  {
    constructor(message: string, exceptionType: ExceptionType) {
        let exception: string = typeof(ExceptionType[exceptionType]);

        if (exception === 'undefined') {
            exception = ExceptionType[ExceptionType.UnknownException];
        } else {
            exception = ExceptionType[exceptionType];
        }

        super(exceptionType + ': ' + message);
    }

    public toJSON(): string {
        return JSON.stringify(new CSharpException(this));
    }
}