import { EnvironmentType } from '../../ObjectModel/Common';
import { ITestFramework, ITestFrameworkEvents, TestFrameworks } from '../../ObjectModel/TestFramework';
import { JasmineTestFramework } from './Jasmine/JasmineTestFramework';
import { IEnvironment } from '../../Environment/IEnvironment';
import { MochaTestFramework } from './Mocha/MochaTestFramework';
import { Exception, ExceptionType } from '../../Exceptions';
import { JestTestFramework } from './Jest/JestTestFramework';
import { EqtTrace } from '../../ObjectModel/EqtTrace';

// tslint:disable:no-stateless-class
export class TestFrameworkFactory {
    private readonly environment: IEnvironment;

    public static instance: TestFrameworkFactory;

    protected constructor(environment: IEnvironment) {
        this.environment = environment;
    }

    public static INITIALIZE(environment: IEnvironment) {
        if (!TestFrameworkFactory.instance) {
            EqtTrace.info(`TestFrameworkFactory: initializing test framework factory`);        
            TestFrameworkFactory.instance = new TestFrameworkFactory(environment);
        }
    }

    public createTestFramework(framework: TestFrameworks): ITestFramework {
        if (this.environment.environmentType === EnvironmentType.NodeJS) {
            EqtTrace.info(`TestFrameworkFactory: Creating test framework ${framework}.`);        
            return new (this.getFrameworkConstructor(framework))(this.createFrameworkEvents(), this.environment.environmentType);
        } else if (this.environment.environmentType === EnvironmentType.Browser) {
            throw new Exception('TestFrameworkFactory.getTestFramework(): Not implemented for browser',
                                ExceptionType.NotImplementedException);
        }
    }

    private createFrameworkEvents(): ITestFrameworkEvents {
        return <ITestFrameworkEvents> {
            onTestCaseEnd: this.environment.createEvent(),
            onTestCaseStart: this.environment.createEvent(),
            onTestSuiteStart: this.environment.createEvent(),
            onTestSuiteEnd: this.environment.createEvent(),
            onTestSessionStart: this.environment.createEvent(),
            onTestSessionEnd: this.environment.createEvent(),
            onMessage: this.environment.createEvent()
        };
    }

    private getFrameworkConstructor(framework: TestFrameworks) : any {
        switch (framework) {
            case TestFrameworks.Jasmine:
                return JasmineTestFramework;
            case TestFrameworks.Mocha:
                return MochaTestFramework;
            case TestFrameworks.Jest:
                return JestTestFramework;
            default:
                return null;
        }
    }
}
