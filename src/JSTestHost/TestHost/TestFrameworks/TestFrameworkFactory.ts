import { EnvironmentType } from '../../ObjectModel/Common';
import { ITestFramework, ITestFrameworkEvents } from '../../ObjectModel/TestFramework';
import { JasmineTestFramework } from './Jasmine/JasmineTestFramework';
import { IEnvironment } from '../../Environment/IEnvironment';
import { MochaTestFramework } from './Mocha/MochaTestFramework';
import { Exception, ExceptionType } from '../../Exceptions/Exception';

export enum TestFramework {
    Jasmine,
    Mocha
}

// tslint:disable:no-stateless-class
export class TestFrameworkFactory {
    private testFrameworkEvents: ITestFrameworkEvents;
    private environmentType: EnvironmentType;

    constructor(environment: IEnvironment) {
        this.environmentType = environment.environmentType;
        
        this.testFrameworkEvents = <ITestFrameworkEvents> {
            onTestCaseEnd: environment.createEvent(),
            onTestCaseStart: environment.createEvent(),
            onTestSuiteStart: environment.createEvent(),
            onTestSuiteEnd: environment.createEvent(),
            onTestSessionStart: environment.createEvent(),
            onTestSessionEnd: environment.createEvent()
        };

    }
    
    public getTestFramework(framework: TestFramework): ITestFramework {
        if (this.environmentType === EnvironmentType.NodeJS) {
            switch (framework) {
                case TestFramework.Jasmine:
                return new JasmineTestFramework(this.testFrameworkEvents, this.environmentType);    
                case TestFramework.Mocha:
                    return new MochaTestFramework(this.testFrameworkEvents, this.environmentType);
                default:
                    return null;
            }
        } else if (this.environmentType === EnvironmentType.Browser) {
            throw new Exception('TestFrameworkFactory.getTestFramework(): Not implemented for browser',
                                ExceptionType.NotImplementedException);
        }
    }
}
