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

        // Get name of enum property
        if (exception === 'undefined') {
            exception = ExceptionType[ExceptionType.UnknownException];
        } else {
            exception = ExceptionType[exceptionType];
        }

        super(exception + ': ' + message);

        if (this.stack) {
            const trace = this.stack.split('\n');
            if (trace.length > 2) {
                const remaitingTrace = trace.splice(2);
                this.stack = [trace[0]].concat(remaitingTrace).join('\n');
            }
        }

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