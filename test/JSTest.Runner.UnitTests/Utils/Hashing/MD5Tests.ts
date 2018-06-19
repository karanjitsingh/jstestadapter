import { Md5 } from '../../../../src/JSTest.Runner/Utils/Hashing/MD5';
import * as Assert from 'assert';

describe('MD5 Tests', () => {
    it('MD5 Self Test', (done) => {
        Assert.strictEqual(Md5.hashStr('hello'), '5d41402abc4b2a76b9719d911017c592', 'Md5 self test failed.');
        done();
    }); 
});