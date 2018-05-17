import { TestFrameworks } from './TestFramework';
import { Exception, ExceptionType } from '../Exceptions';

interface DiagTracing {
    IsErrorEnabled: boolean;
    IsInfoEnabled: boolean;
    IsWarningEnabled: boolean;
    IsVerboseEnabled: boolean;
}

export class JSTestSettings {
    // tslint:disable:variable-name
    public JavaScriptTestFramework: TestFrameworks;
    public TestFrameworkConfigJson: JSON;
    public DiagTracing: DiagTracing;

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

        this.DiagTracing = json.DiagTracing;

        if (json.TestFrameworkConfigJson !== '') {
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