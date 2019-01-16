import { Exception, ExceptionType } from '../Exceptions';
import { TestFrameworks } from './TestFramework';

export class JSTestSettings {
    // tslint:disable:variable-name
    public readonly JavaScriptTestFramework: TestFrameworks;
    public readonly TestFrameworkConfigJson: JSON;
    public readonly CodeCoverageEnabled: boolean;
    public readonly TempDir: string;

    constructor(json: any, tempDir: string) {
        this.JavaScriptTestFramework = -1;
        this.TempDir = tempDir;

        for (let i = 0; TestFrameworks[i] !== undefined && TestFrameworks[i].toLowerCase(); i++) {
            if (TestFrameworks[i].toLowerCase() === json.JavaScriptTestFramework.toLowerCase()) {
                this.JavaScriptTestFramework = i;
                break;
            }
        }

        this.CodeCoverageEnabled = json.CodeCoverageEnabled && json.CodeCoverageEnabled === true;

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
    }
}
