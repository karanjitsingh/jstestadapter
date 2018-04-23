import { ISerializable } from '../Utils/ISerializable';
import { CSharpException } from './CSharpException';

export enum ExceptionType {
    InvalidArgumentsException,
    InvalidMessageException,
    InvalidJSONException,
    NotImplementedException,
    UnknownException
}

export class Exception extends Error implements ISerializable  {
    private cSharpException: CSharpException;

    constructor(message: string, exceptionType: ExceptionType) {
        let exception: string = typeof(ExceptionType[exceptionType]);

        if (exception === 'undefined') {
            exception = ExceptionType[ExceptionType.UnknownException];
        } else {
            exception = ExceptionType[exceptionType];
        }

        super(exception + ': ' + message);

        // https://github.com/Microsoft/TypeScript/wiki/FAQ#why-doesnt-extending-built-ins-like-error-array-and-map-work
        Object.setPrototypeOf(this, Exception.prototype);
    }

    public toJSON(): Object {
        if (!this.cSharpException) {
            this.cSharpException = new CSharpException(this);
        }
        return this.cSharpException;
    }
}