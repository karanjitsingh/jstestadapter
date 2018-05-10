import { TestFrameworks } from './TestFramework';

export class TestRunSettings {
    // tslint:disable:variable-name
    public TestFramework: TestFrameworks;
    public RunInParallel: boolean;

    constructor(json: any) {
        
        for (let i = 0; TestFrameworks[i] !== undefined; i++) {
            if (TestFrameworks[i].toLowerCase() === json.TestFramework.toLowerCase()) {
                this.TestFramework = i;
                return;
            }
        }
    }
}