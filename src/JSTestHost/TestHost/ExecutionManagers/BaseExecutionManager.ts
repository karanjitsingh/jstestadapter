import { IEnvironment } from '../../Environment/IEnvironment';
import { MessageSender } from '../MessageSender';
import { TestFrameworkFactory } from '../TestFrameworks/TestFrameworkFactory';
import { IEvent, IEventArgs, EnvironmentType, IEventHandler } from '../../ObjectModel/Common';
import { Exception, ExceptionType } from '../../Exceptions';
import { RunSettings } from '../RunSettings';
import { TestFrameworkEventHandlers } from '../TestFrameworks/TestFrameworkEventHandlers';
import { TestSessionManager } from './TestSessionManager';
import { TestFrameworks } from '../../ObjectModel/TestFramework';

export abstract class BaseExecutionManager {
    protected readonly environment: IEnvironment;
    protected readonly messageSender: MessageSender;
    protected readonly testFrameworkFactory: TestFrameworkFactory;
    protected readonly onComplete: IEvent<IEventArgs>;
    protected readonly testSessionManager: TestSessionManager;

    protected runSettings: RunSettings;

    protected abstract testFrameworkEventHandlers: TestFrameworkEventHandlers;
    protected abstract runStatsChange: IEventHandler<IEventArgs>;
    
    constructor(environment: IEnvironment, messageSender: MessageSender, testFramework: TestFrameworks) {
        this.environment = environment;

        if (this.environment.environmentType !== EnvironmentType.NodeJS) {
            throw new Exception('Not implemented', ExceptionType.NotImplementedException);
        }

        this.messageSender = messageSender;
        this.onComplete = environment.createEvent();
        this.testFrameworkFactory = new TestFrameworkFactory(this.environment);
        this.testSessionManager = new TestSessionManager(this.environment);
    }

    protected setRunSettingsFromXml(runSettingsXml: string) {
        this.runSettings = new RunSettings(runSettingsXml, this.environment.getXmlParser());
    }

    protected getCompletetionPromise(): Promise<void> {
        return new Promise((resolve) => {
            this.onComplete.subscribe((sender: object, args: IEventArgs) => {
                resolve();
            });
        });
    }

    protected getSourcesFromAdapterSourceMap(adapterSourceMap: { [key: string]: string[]; }): Array<string> {
        const keys = Object.keys(adapterSourceMap);
        let sourceList = [];

        keys.forEach(key => {
            sourceList = sourceList.concat(adapterSourceMap[key]);
        });
        
        return sourceList;
    }
}