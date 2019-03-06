import { IEnvironment } from '../../../../src/JSTest.Runner/Environment/IEnvironment';
import { ITestFrameworkEvents, ITestFramework, TestFrameworks } from '../../../../src/JSTest.Runner/ObjectModel/TestFramework';
import { EnvironmentType, IEvent, IEventArgs } from '../../../../src/JSTest.Runner/ObjectModel/Common';
import { TestFrameworkEventHandlers } from '../../../../src/JSTest.Runner/TestRunner/TestFrameworks/TestFrameworkEventHandlers';
import { ExecutionManager, DiscoveryManager } from '../../../../src/JSTest.Runner/TestRunner/ExecutionManagers';
import { MessageSender } from '../../../../src/JSTest.Runner/TestRunner/MessageSender';
import { JSTestSettings } from '../../../../src/JSTest.Runner/ObjectModel';
import { BaseExecutionManager } from '../../../../src/JSTest.Runner/TestRunner/ExecutionManagers/BaseExecutionManager';
import { TestFrameworkFactory } from '../../../../src/JSTest.Runner/TestRunner/TestFrameworks/TestFrameworkFactory';
import { TestSessionManager, TestSession } from '../../../../src/JSTest.Runner/TestRunner/ExecutionManagers/TestSessionManager';

export class TestableFramework implements ITestFramework {
    public executorUri: string = '';
    public environmentType: EnvironmentType = EnvironmentType.NodeJS;
    public startExecutionWithSources = () => { return; };
    public startExecutionWithTests = () => { return; };
    public supportsJsonOptions: boolean = false;
    public canHandleMultipleSources: boolean = true;
    public initialize = () => { return; };
    public startDiscovery = () => { return; };
    public testFrameworkEvents: ITestFrameworkEvents;
    public supportsCodeCoverage: boolean = false;

    constructor(env: IEnvironment) {
        this.testFrameworkEvents = {
            onErrorMessage: env.createEvent(),
            onTestCaseEnd: env.createEvent(),
            onTestCaseStart: env.createEvent(),
            onTestSessionEnd: env.createEvent(),
            onTestSessionStart: env.createEvent(),
            onTestSuiteEnd: env.createEvent(),
            onTestSuiteStart: env.createEvent()
        };
    }
}

export class TestableDiscoveryManager extends DiscoveryManager  {

    constructor(environment: IEnvironment,
                messageSender: MessageSender,
                settings: JSTestSettings,
                eventHandlers?: TestFrameworkEventHandlers) {
        super(environment, messageSender, settings);

        if (eventHandlers) {
            this.testFrameworkEventHandlers = eventHandlers;
        }
    }

    // tslint:disable-next-line
    public sessionError(sources: Array<string>, err: Error) {
        super.sessionError(sources, err);
    }

    public getEventHandlers(): TestFrameworkEventHandlers {
        return this.testFrameworkEventHandlers;
    }
}

export class TestableExecutionManager extends ExecutionManager  {

    constructor(environment: IEnvironment,
                messageSender: MessageSender,
                settings: JSTestSettings,
                eventHandlers?: TestFrameworkEventHandlers) {
        super(environment, messageSender, settings);

        if (eventHandlers) {
            this.testFrameworkEventHandlers = eventHandlers;
        }
    }

    // tslint:disable-next-line
    public sessionError(sources: Array<string>, err: Error) {
        super.sessionError(sources, err);
    }

    public getEventHandlers(): TestFrameworkEventHandlers {
        return this.testFrameworkEventHandlers;
    }
}

export class TestableBaseExecutionManager extends BaseExecutionManager {
    protected testFrameworkEventHandlers: TestFrameworkEventHandlers;
    protected jsTestSettings: JSTestSettings;
    protected testFramework: TestFrameworks;

    constructor(environment: IEnvironment) {
        super(environment, null, null);
    }

    public raiseCompletion() {
        this.onComplete.raise(null, null);
    }

    public getPromise(): Promise<void> {
        return super.getCompletionPromise();
    }

    public getSources(adapterSourceMap: { [key: string]: string[]; }): Array<string> {
        return super.getSourcesFromAdapterSourceMap(adapterSourceMap);
    }

    public getOnCompleteEvent(): IEvent<IEventArgs> {
        return this.onComplete;
    }

    public getTestFrameworkFactory(): TestFrameworkFactory {
        return this.testFrameworkFactory;
    }

    public getTestSessionManager(): TestSessionManager {
        return this.testSessionManager;
    }
}

export class TestableTestSessionManager extends TestSessionManager {
    constructor(env: IEnvironment) {
        super(env);
    }

    public runSession(testSession: TestSession) {
        return this.runSessionInDomain(testSession);
    }
}

export class TestableTestFrameworkFactory extends TestFrameworkFactory {
    constructor(env: IEnvironment) {
        super(env);
    }
}