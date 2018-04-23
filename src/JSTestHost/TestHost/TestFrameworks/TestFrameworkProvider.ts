import { EnvironmentType } from '../../ObjectModel/Common';
import { ITestFramework } from '../../ObjectModel/TestFramework';
import { JasmineTestFramework } from './Jasmine/JasmineTestFramework';
import { IEnvironment } from '../../Environment/IEnvironment';
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
                    const jasmineFramework = new JasmineTestFramework(enviroment.environmentType);    
                    initializeTestFrameworkEvents(jasmineFramework, enviroment);
                    return jasmineFramework;
                case TestFramework.Mocha:
                    const mochaFramework = new MochaTestFramework(enviroment.environmentType);
                    initializeTestFrameworkEvents(mochaFramework, enviroment);
                    return mochaFramework;
                default:
                    return null;
            }
        } else if (enviroment.environmentType === EnvironmentType.Browser) {
            throw new Exception('TestFrameworkProvider.getTestFramework(): Not implemented for browser',
                                ExceptionType.NotImplementedException);
        }
    }

    function initializeTestFrameworkEvents(framework: ITestFramework, environment: IEnvironment) {
        framework.onTestCaseStart = environment.createEvent();
        framework.onTestCaseEnd = environment.createEvent();
        framework.onTestSuiteStart = environment.createEvent();
        framework.onTestSuiteEnd = environment.createEvent();
        framework.onTestSessionStart = environment.createEvent();
        framework.onTestSessionEnd = environment.createEvent();
    }
}