import { Exception, ExceptionType } from '../../../src/JSTestHost/Exceptions/Exception';
import * as Assert from 'assert';

describe('Exception Suite', () => {
    it('Exception message is of correct format', (done: any) => {
        const e = new Exception('some exception', ExceptionType.InvalidArgumentsException);
        try {
            throw e;
        } catch (e) {
            Assert.equal('InvalidArgumentsException: some exception', e.message);
        }
        done();
    });
});