import * as Assert from 'assert';
import * as fs from 'fs';
import * as OS from 'os';
import * as path from 'path';
import { JSTestSettings } from '../../../src/JSTest.Runner/ObjectModel';
import { Exception, ExceptionType } from '../../../src/JSTest.Runner/Exceptions';
import { IEnvironment } from '../../../src/JSTest.Runner/Environment/IEnvironment';

describe('JSTestSettings suite', () => {
    it('constructor will throw if invalid test framework', (done) => {
        Assert.throws(() => new JSTestSettings({ JavaScriptTestFramework: 'framework', TestFrameworkConfigJson: '{}' }, {} as IEnvironment),
            (err) => err instanceof Exception && err.exceptionName === 'UnSupportedTestFramework',
            'Should throw on unsupported test framework.');
        done();
    });

    it('constructor will throw if invalid config json passed', (done) => {
        Assert.throws(() => new JSTestSettings({ JavaScriptTestFramework: 'jasmine', TestFrameworkConfigJson: '{' }, {} as IEnvironment),
            (err) => err instanceof Exception && err.exceptionName === 'InvalidJSONException',
            'Should throw on invalid config json.');

        Assert.doesNotThrow(() => new JSTestSettings({ JavaScriptTestFramework: 'jasmine', TestFrameworkConfigJson: null }, {} as IEnvironment),
            (err) => err instanceof Exception && err.exceptionName === 'InvalidJSONException',
            'Should not throw on null config json');
        done();
    });

    it('JSTestSettings will create empty config object for null json', (done) => {
        const settings = new JSTestSettings({ JavaScriptTestFramework: 'jasmine', TestFrameworkConfigJson: null }, {} as IEnvironment);
        Assert.deepEqual(settings.TestFrameworkConfigJson, {});
        done();
    });

    it('will throw for not found attachments folder', (done) => {
        Assert.throws(() => new JSTestSettings({
            JavaScriptTestFramework: 'jasmine',
            TestFrameworkConfigJson: null,
            UploadAttachments: true,
            AttachmentsFolder: path.join(OS.tmpdir(), Date.now().toString())
        }, {} as IEnvironment),
            err => err instanceof Exception && err.exceptionName === 'NotFoundException',
            'Should throw not found exception for non-existing attachments folder');

        done();
    });

    it('will throw for invalid attachments folder', (done) => {
        Assert.throws(() => new JSTestSettings({
            JavaScriptTestFramework: 'jasmine',
            TestFrameworkConfigJson: null,
            UploadAttachments: true,
            AttachmentsFolder: __filename
        }, {} as IEnvironment),
            err => err instanceof Exception && err.exceptionName === 'InvalidArgumentsException',
            'Should throw invalid argument exception for a path which is not a directory');

        done();
    });

    it('will use temp path for attachments folder', () => {
        const tmpDir = OS.tmpdir();
        const settings = new JSTestSettings({
            JavaScriptTestFramework: 'jasmine',
            TestFrameworkConfigJson: null,
            UploadAttachments: true
        }, { getTempDirectory: () => tmpDir } as IEnvironment);

        Assert.ok(settings.AttachmentsFolder.indexOf(tmpDir) === 0, 'Invalid attachments folder path');

        // make sure temp folder is deleted
        removeTempDir(settings.AttachmentsFolder);
    });

    it('will use the specified path for attachments folder', () => {
        const tmpDir = OS.tmpdir();
        const settings = new JSTestSettings({
            JavaScriptTestFramework: 'jasmine',
            TestFrameworkConfigJson: null,
            UploadAttachments: true,
            AttachmentsFolder: tmpDir
        }, {} as IEnvironment);

        Assert.ok(settings.AttachmentsFolder.indexOf(tmpDir) === 0, 'Invalid attachments folder path');

        // make sure temp folder is deleted
        removeTempDir(settings.AttachmentsFolder);
    });
});

function removeTempDir(path: string): void {
    if (fs.existsSync(path) && fs.lstatSync(path).isDirectory()) {
        fs.rmdirSync(path);
    }
}