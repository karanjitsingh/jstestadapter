import { TestCase } from '../../../src/JSTest.Runner/ObjectModel/Common';
import * as Assert from 'assert';
import { Md5 } from '../../../src/JSTest.Runner/Utils/Hashing/MD5';

describe('new TestCase object will setup object properties', () => {
    it('new TestCase object will create right id', (done) => {
        const testcase = new TestCase('filename', 'testcase', 'uri');

        const hash = new Md5();
        hash.appendStr('testcaseurifilename').getGuid();
        Assert.equal(testcase.Id.toUpperCase(), 'DC521C8D-C7E4-9404-AE9F-EEB1211E23D2', 'Id should be correct guid.');
        done();
    });

    it('new TestCase object will initialize all properties correctly', (done) => {
        const testcase = new TestCase('filename', 'testcase', 'uri');

        const obj = {
            CodeFilePath: '',
            DisplayName: '',
            ExecutorUri: 'uri',
            FullyQualifiedName: 'testcase',
            Id: 'dc521c8d-c7e4-9404-ae9f-eeb1211e23d2',
            LineNumber: -1,
            Properties: [],
            Source: 'filename',
            AttachmentGuid: null
        };

        Assert.deepEqual(testcase, obj);

        done();
    });
});