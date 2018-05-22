import { BaseExecutionManager } from '../../../../src/JSTest.Runner/TestRunner/ExecutionManagers/BaseExecutionManager';
import { TestFrameworkEventHandlers } from '../../../../src/JSTest.Runner/TestRunner/TestFrameworks/TestFrameworkEventHandlers';
import { IEnvironment } from '../../../../src/JSTest.Runner/Environment/IEnvironment';
import { Environment } from '../../../../src/JSTest.Runner/Environment/Node/Environment';
import { IEvent, IEventArgs } from '../../../../src/JSTest.Runner/ObjectModel/Common';
import { TestFrameworkFactory } from '../../../../src/JSTest.Runner/TestRunner/TestFrameworks/TestFrameworkFactory';
import { TestSessionManager } from '../../../../src/JSTest.Runner/TestRunner/ExecutionManagers/TestSessionManager';
import { Event } from '../../../../src/JSTest.Runner/Events/Event';
import { Mock } from 'typemoq';
import * as Assert from 'assert';

describe('BaseExecutionManager Suite', () => {
    let executionManager: TestableExecutionManager;
    const environment = new Environment();

    TestFrameworkFactory.INITIALIZE(environment);
    TestSessionManager.INITIALIZE(environment);

    before(() => {
        executionManager = new TestableExecutionManager(environment);
    });

    it('constructor will initialize onComplete, testFrameworkFactory and testSessionManager', (done) => {
        Assert.equal(executionManager.getOnCompleteEvent() instanceof Event, true);
        Assert.equal(executionManager.getTestFrameworkFactory() === TestFrameworkFactory.instance, true);
        Assert.equal(executionManager.getTestSessionManager() === TestSessionManager.instance, true);
        done();
    });

    it('getCompletionPromise returns a promise which resolves on completion.', (done) => {
        const promise = executionManager.getPromise();
        promise.then(() => {
            done();
        });
        executionManager.raiseCompletion();
    });

    it('getSourcesFromAdapterSourceMap will return source list', (done) => {
        const sourceMap = {
            x: ['file 1', 'file 2'],
            y: ['file 3', 'file 4', 'file 5']
        };
        
        const sourcelist = executionManager.getSources(sourceMap);
        Assert.deepEqual(['file 1', 'file 2', 'file 3', 'file 4', 'file 5'], sourcelist);
        done();
    });
});

class TestableExecutionManager extends BaseExecutionManager {
    protected testFrameworkEventHandlers: TestFrameworkEventHandlers;

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