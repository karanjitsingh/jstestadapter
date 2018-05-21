import { Exception, ExceptionType, CSharpException } from '../../../src/JSTest.Runner/Exceptions';
import * as Assert from 'assert';

describe('Exception Suite', () => {
    it('Exception message is of correct format', (done: any) => {
        const e = new Exception('some exception', ExceptionType.InvalidArgumentsException);
        try {
            throw e;
        } catch (e) {
            Assert.equal('some exception', e.message);
            Assert.equal('InvalidArgumentsException', e.exceptionName);
        }
        done();
    });

    it('Serialized Exception outputs serialized CSharpException', (done: any) => {
        const exception = new Exception('some exception', ExceptionType.InvalidArgumentsException);
        const csException = new CSharpException(exception);
        let csExceptionJson;
        let exceptionJson;

        try {
            csExceptionJson = (JSON.stringify(csException));
            exceptionJson = (JSON.stringify(exception));
        } catch (e) {
            Assert.fail('Error in parsing serialized Exception.');
        }

        Assert.equal(exceptionJson, csExceptionJson);
        done(); 
    });

    it('CSharpException should serialize to correct format', (done: any) => {
        const error = new Error('some error');
        error.stack = 'some stack';

        const csException = new CSharpException(error);
        const csExceptionWithSource = new CSharpException(error, 'some source');
        
        const csExceptionJson = JSON.parse(JSON.stringify(csException));
        const csExceptionWithSourceJson = JSON.parse(JSON.stringify(csExceptionWithSource));

        Assert.deepEqual(
            csExceptionJson,
            {
                ClassName: 'System.Exception',
                Message: 'some error',
                Data: null,
                InnerException: null,
                HelpURL: null,
                StackTraceString: 'some stack',
                RemoteStackTraceString: null,
                RemoteStackIndex: 0,
                ExceptionMethod: null,
                HResult: -2147023895,
                Source: null,
                WatsonBuckets: null
            }
        );

        Assert.deepEqual(
            csExceptionWithSourceJson,
            {
                ClassName: 'System.Exception',
                Message: 'some error',
                Data: null,
                InnerException: null,
                HelpURL: null,
                StackTraceString: 'some stack',
                RemoteStackTraceString: null,
                RemoteStackIndex: 0,
                ExceptionMethod: null,
                HResult: -2147023895,
                Source: 'some source',
                WatsonBuckets: null
            }
        );
        done();
    });
});