import { TestFrameworks } from './TestFramework';
import { Exception, ExceptionType } from '../Exceptions';

export class JSTestSettings {
    // tslint:disable:variable-name
    public JavaScriptTestFramework: TestFrameworks;
    public TestFrameworkConfigJson: JSON;
    public UploadAttachments: boolean;

    constructor(json: any) {
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
    }
}