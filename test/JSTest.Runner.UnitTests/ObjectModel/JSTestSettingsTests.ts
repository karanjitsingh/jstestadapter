import * as Assert from 'assert';
import * as OS from 'os';
import * as path from 'path';
import { JSTestSettings } from '../../../src/JSTest.Runner/ObjectModel';
import { Exception, ExceptionType } from '../../../src/JSTest.Runner/Exceptions';
import { IEnvironment } from '../../../src/JSTest.Runner/Environment/IEnvironment';
import { defaultTestEnvironment } from '../Environment/TestEnvironment';

describe('JSTestSettings suite', () => {
    it('constructor will throw if invalid test framework', (done) => {
        Assert.throws(() => new JSTestSettings({ JavaScriptTestFramework: 'framework', TestFrameworkConfigJson: '{}' }, defaultTestEnvironment),
            (err) => err instanceof Exception && err.exceptionName === ExceptionType[ExceptionType.UnSupportedTestFramework],
            'Should throw on unsupported test framework.');
        done();
    });

    it('constructor will throw if invalid config json passed', (done) => {
        Assert.throws(() => new JSTestSettings({ JavaScriptTestFramework: 'jasmine', TestFrameworkConfigJson: '{' }, defaultTestEnvironment),
            (err) => err instanceof Exception && err.exceptionName === ExceptionType[ExceptionType.InvalidJSONException],
            'Should throw on invalid config json.');

        Assert.doesNotThrow(() => new JSTestSettings({ JavaScriptTestFramework: 'jasmine', TestFrameworkConfigJson: null }, defaultTestEnvironment),
            (err) => err instanceof Exception && err.exceptionName === ExceptionType[ExceptionType.InvalidJSONException],
            'Should not throw on null config json');
        done();
    });

    it('JSTestSettings will create empty config object for null json', (done) => {
        const settings = new JSTestSettings({ JavaScriptTestFramework: 'jasmine', TestFrameworkConfigJson: null }, defaultTestEnvironment);
        Assert.deepEqual(settings.TestFrameworkConfigJson, {});
        done();
    });

    it('will throw for not found attachments folder', (done) => {
        Assert.throws(() => new JSTestSettings({
            JavaScriptTestFramework: 'jasmine',
            TestFrameworkConfigJson: null,
            AttachmentsFolder: path.join(OS.tmpdir(), Date.now().toString())
        }, defaultTestEnvironment),
            err => err instanceof Exception && err.exceptionName === ExceptionType[ExceptionType.DirectoryNotFoundException],
            'Should throw not found exception for non-existing attachments folder');

        done();
    });

    it('will throw for invalid attachments folder', (done) => {
        Assert.throws(() => new JSTestSettings({
            JavaScriptTestFramework: 'jasmine',
            TestFrameworkConfigJson: null,
            AttachmentsFolder: __filename
        }, defaultTestEnvironment),
            err => err instanceof Exception && err.exceptionName === ExceptionType[ExceptionType.InvalidArgumentsException],
            'Should throw invalid argument exception for a path which is not a directory');

        done();
    });

    it('will use temp path for attachments folder', () => {
        const tmpDir = OS.tmpdir();
        const settings = new JSTestSettings({
            JavaScriptTestFramework: 'jasmine',
            TestFrameworkConfigJson: null,
        }, { getTempDirectory: () => tmpDir } as IEnvironment);

        Assert.ok(settings.AttachmentsFolder.indexOf(tmpDir) === 0, 'Invalid attachments folder path');
    });

    it('will use the specified path for attachments folder', () => {
        const tmpDir = OS.tmpdir();
        const settings = new JSTestSettings({
            JavaScriptTestFramework: 'jasmine',
            TestFrameworkConfigJson: null,
            AttachmentsFolder: tmpDir
        }, defaultTestEnvironment);

        Assert.ok(settings.AttachmentsFolder.indexOf(tmpDir) === 0, 'Invalid attachments folder path');
    });
});