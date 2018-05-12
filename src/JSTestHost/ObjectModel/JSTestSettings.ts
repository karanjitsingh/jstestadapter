import { TestFrameworks } from './TestFramework';
import { Exception, ExceptionType } from '../Exceptions';

export class JSTestSettings {
    // tslint:disable:variable-name
    public JavaScriptTestFramework: TestFrameworks;
    public TestFrameworkConfigJson: JSON;

    constructor(json: any) {
        
        for (let i = 0; TestFrameworks[i] !== undefined && TestFrameworks[i].toLowerCase(); i++) {
            if (TestFrameworks[i].toLowerCase() === json.JavaScriptTestFramework.toLowerCase()) {
                this.JavaScriptTestFramework = i;
                break;
            }
        }

        try {
            this.TestFrameworkConfigJson = JSON.parse(json.TestFrameworkConfigJson);
        } catch (e) {
            throw new Exception('Invalid TestFrameworkConfig setting.', ExceptionType.InvalidJSONException);
        } 
    }
}