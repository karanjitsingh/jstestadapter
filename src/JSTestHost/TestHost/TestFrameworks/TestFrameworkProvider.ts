import { ITestFramework } from './ITestFramework';
import { JasmineTestFramework } from './Jasmine/JasmineTestFramework';
import { IEnvironment, EnvironmentType } from '../../Environment/IEnvironment';
import { MochaTestFramework } from './Mocha/MochaTestFramework';
import { Exception, ExceptionType } from '../../Exceptions/Exception';

export enum TestFramework {
    Jasmine,
    Mocha
}

// tslint:disable:no-stateless-class
export namespace TestFrameworkProvider {
    export function getTestFramework(framework: TestFramework, enviroment: IEnvironment): ITestFramework {
        if (enviroment.environmentType === EnvironmentType.NodeJS) {
            switch (framework) {
                case TestFramework.Jasmine:
                    return new JasmineTestFramework(enviroment);
                case TestFramework.Mocha:
                    return new MochaTestFramework(enviroment);
                default:
                    return null;
            }
        } else if (enviroment.environmentType === EnvironmentType.Browser) {
            throw new Exception('TestFrameworkProvider.getTestFramework(): Not implemented for browser',
                                ExceptionType.NotImplementedException);
        }
    }
}