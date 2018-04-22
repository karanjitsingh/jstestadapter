import { Exception, ExceptionType } from '../../../src/JSTestHost/Exceptions/Exception';
import * as Assert from 'assert';
import { CSharpException } from '../../../src/JSTestHost/Exceptions/CSharpException';

describe('Exception Suite', () => {
    it('Exception message is of correct format', (done: any) => {
        const e = new Exception('some exception', ExceptionType.InvalidArgumentsException);
        try {
            throw e;
        } catch (e) {
            Assert.equal(ExceptionType[ExceptionType.InvalidArgumentsException] + ': some exception', e.message);
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
        const csException = new CSharpException(new Error('some error'));
        const csExceptionWithSource = new CSharpException(new Error('some error'), 'some source');
        
        const csExceptionJson = JSON.parse(JSON.stringify(csException));
        const csExceptionWithSourceJson = JSON.parse(JSON.stringify(csExceptionWithSource));

        // tslint:disable:no-string-literal
        Assert.equal(csExceptionJson['ClassName'], 'System.Exception');
        Assert.equal(csExceptionJson['Message'], 'some error');
        Assert.equal(csExceptionJson['Data'], null);
        Assert.equal(csExceptionJson['InnerException'], null);
        Assert.equal(csExceptionJson['HelpURL'], null);
        Assert.notEqual(csExceptionJson['StackTraceString'], '');
        Assert.equal(csExceptionJson['RemoteStackTraceString'], null);
        Assert.equal(csExceptionJson['RemoteStackIndex'], 0);
        Assert.equal(csExceptionJson['ExceptionMethod'], null);
        Assert.equal(csExceptionJson['HResult'], -2147023895);
        Assert.equal(csExceptionJson['Source'], null);
        Assert.equal(csExceptionJson['WatsonBuckets'], null);
        
        Assert.equal(csExceptionWithSourceJson['ClassName'], 'System.Exception');
        Assert.equal(csExceptionWithSourceJson['Message'], 'some error');
        Assert.equal(csExceptionWithSourceJson['Data'], null);
        Assert.equal(csExceptionWithSourceJson['InnerException'], null);
        Assert.equal(csExceptionWithSourceJson['HelpURL'], null);
        Assert.notEqual(csExceptionWithSourceJson['StackTraceString'], '');
        Assert.equal(csExceptionWithSourceJson['RemoteStackTraceString'], null);
        Assert.equal(csExceptionWithSourceJson['RemoteStackIndex'], 0);
        Assert.equal(csExceptionWithSourceJson['ExceptionMethod'], null);
        Assert.equal(csExceptionWithSourceJson['HResult'], -2147023895);
        Assert.equal(csExceptionWithSourceJson['Source'], 'some source');
        Assert.equal(csExceptionWithSourceJson['WatsonBuckets'], null);
        done();
    });
});