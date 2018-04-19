import { ITestFramework } from './ITestFramework';
import { JasmineTestFramework } from './Jasmine/JasmineTestFramework';
import { IEnvironment } from '../../Environment/IEnvironment';
import { MochaTestFramework } from './Mocha/MochaTestFramework';

export enum TestFramework {
    Jasmine,
    Mocha
}

// tslint:disable:no-stateless-class
export namespace TestFrameworkProvider {
    export function getTestFramework(framework: TestFramework, enviroment: IEnvironment): ITestFramework {
        switch (framework) {
            case TestFramework.Jasmine:
                return new JasmineTestFramework(enviroment);
            case TestFramework.Mocha:
                return new MochaTestFramework(enviroment);
            default:
                return null;
        }
    }
}