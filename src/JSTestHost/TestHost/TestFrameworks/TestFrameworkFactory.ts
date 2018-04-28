import { EnvironmentType } from '../../ObjectModel/Common';
import { ITestFramework, ITestFrameworkEvents } from '../../ObjectModel/TestFramework';
import { JasmineTestFramework } from './Jasmine/JasmineTestFramework';
import { IEnvironment } from '../../Environment/IEnvironment';
import { MochaTestFramework } from './Mocha/MochaTestFramework';
import { Exception, ExceptionType } from '../../Exceptions';

export enum SupportedFramework {
    Jasmine,
    Mocha
}

// tslint:disable:no-stateless-class
export class TestFrameworkFactory {
    private testFrameworkEvents: ITestFrameworkEvents;
    private environmentType: EnvironmentType;
    private frameworkCache: {[supportedFramework: number]: (testFrameworkEvents: ITestFrameworkEvents,
                                                       environmentType: EnvironmentType) => void } = [];

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
    
    public getTestFramework(framework: SupportedFramework): ITestFramework {
        if (this.environmentType === EnvironmentType.NodeJS) {
            // Check cache otherwise populate it
            if (!this.frameworkCache[framework]) {
                this.frameworkCache[framework] = this.dynamiclyLoadConstructor(framework);
            }
            return new this.frameworkCache[framework](this.testFrameworkEvents, this.environmentType);

        } else if (this.environmentType === EnvironmentType.Browser) {
            throw new Exception('TestFrameworkFactory.getTestFramework(): Not implemented for browser',
                                ExceptionType.NotImplementedException);
        }
    }

    private dynamiclyLoadConstructor(framework: SupportedFramework) : any {
        switch (framework) {
            case SupportedFramework.Jasmine:
                return JasmineTestFramework;    
            case SupportedFramework.Mocha:
                return MochaTestFramework;
            default:
                return null;
        }
    }
}
