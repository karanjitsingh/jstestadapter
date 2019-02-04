import * as fs from 'fs';
import * as path from 'path';
import { TestFrameworks } from './TestFramework';
import { IEnvironment } from '../Environment/IEnvironment';
import { Exception, ExceptionType } from '../Exceptions';

export class JSTestSettings {
    // tslint:disable:variable-name
    public JavaScriptTestFramework: TestFrameworks;
    public TestFrameworkConfigJson: JSON;
    public AttachmentsFolder: string;

    constructor(json: any, environment: IEnvironment) {
        this.JavaScriptTestFramework = -1;

        for (let i = 0; TestFrameworks[i] !== undefined && TestFrameworks[i].toLowerCase(); i++) {
            if (TestFrameworks[i].toLowerCase() === json.JavaScriptTestFramework.toLowerCase()) {
                this.JavaScriptTestFramework = i;
                break;
            }
        }

        if (this.JavaScriptTestFramework === -1) {
            throw new Exception(`'${json.JavaScriptTestFramework}' is not a valid supported test framework.`,
                ExceptionType.UnSupportedTestFramework);
        }

        if (json.TestFrameworkConfigJson !== null && json.TestFrameworkConfigJson !== '') {
            try {
                this.TestFrameworkConfigJson = JSON.parse(json.TestFrameworkConfigJson);
            } catch (e) {
                throw new Exception('Invalid TestFrameworkConfigJson: ' + e.message, ExceptionType.InvalidJSONException);
            }
        } else {
            this.TestFrameworkConfigJson = JSON.parse('{}');
        }

        let attachmentsFolder = json.AttachmentsFolder;
        if (!attachmentsFolder) {
            attachmentsFolder = environment.getTempDirectory();
        }

        if (!fs.existsSync(attachmentsFolder)) {
            throw new Exception('Attachments folder does not exist: ' + attachmentsFolder, ExceptionType.DirectoryNotFoundException);
        }

        if (!fs.lstatSync(attachmentsFolder).isDirectory()) {
            throw new Exception('Attachments folder needs to be a valid directory: ' + attachmentsFolder,
                ExceptionType.InvalidArgumentsException);
        }

        // We will have all attachment folders under jstestadapter
        attachmentsFolder = path.join(attachmentsFolder, 'jstestadapter_runs');
        if (!fs.existsSync(attachmentsFolder) || !fs.lstatSync(attachmentsFolder).isDirectory()) {
            fs.mkdirSync(attachmentsFolder);
        }

        // We will have folder for each process
        attachmentsFolder = path.join(attachmentsFolder, `run_${process.pid}`);
        if (!fs.existsSync(attachmentsFolder) || !fs.lstatSync(attachmentsFolder).isDirectory()) {
            fs.mkdirSync(attachmentsFolder);
        }

        // Add older for each run
        attachmentsFolder = path.join(attachmentsFolder, Date.now().toString());
        if (!fs.existsSync(attachmentsFolder) || !fs.lstatSync(attachmentsFolder).isDirectory()) {
            fs.mkdirSync(attachmentsFolder);
        }

        // Set attachments folder
        this.AttachmentsFolder = attachmentsFolder;

        // Set environment variable
        // TODO: we should probably get the env key from jstestcontext package
        /* tslint:disable:no-string-literal */
        process.env['JSTEST_RESULTS_DIRECTORY'] = attachmentsFolder;
    }
}