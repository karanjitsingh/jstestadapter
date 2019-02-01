import fs = require('fs');
import path = require('path');
import { TestFrameworks } from './TestFramework';
import { IEnvironment } from '../Environment/IEnvironment';
import { Exception, ExceptionType } from '../Exceptions';

export class JSTestSettings {
    // tslint:disable:variable-name
    public JavaScriptTestFramework: TestFrameworks;
    public TestFrameworkConfigJson: JSON;
    public UploadAttachments: boolean;
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

        this.UploadAttachments = json.UploadAttachments === true;
        if (this.UploadAttachments) {
            let attachmentsFolder = json.AttachmentsFolder;
            if (!attachmentsFolder) {
                attachmentsFolder = environment.getTempDirectory();
            }

            if (!fs.existsSync(attachmentsFolder)) {
                throw new Exception('Attachments folder does not exist: ' + attachmentsFolder, ExceptionType.NotFoundException);
            }

            const lstat = fs.lstatSync(attachmentsFolder);
            if (!lstat.isDirectory()) {
                throw new Exception('Attachments folder needs to be a valid directory: ' + attachmentsFolder, ExceptionType.InvalidArgumentsException);
            }

            // Make sure we have a distinct folder for each test run
            attachmentsFolder = path.join(attachmentsFolder, `jstestadapter_run_${Date.now()}`);

            // Make sure that folder exists
            fs.mkdirSync(attachmentsFolder);

            // Set attachments folder
            this.AttachmentsFolder = attachmentsFolder;

            // Set environment variable
            // TODO: we should probably get the env key from jstestcontext package
            process.env["JSTEST_RESULTS_DIRECTORY"] = attachmentsFolder;
        }
    }
}