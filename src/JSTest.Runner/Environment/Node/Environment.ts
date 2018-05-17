import { EnvironmentType, IEventArgs, IEvent } from '../../ObjectModel/Common';
import { IEnvironment } from '../IEnvironment';
import { CommunicationManager } from './CommunicationManager';
import { ICommunicationManager } from '../ICommunicationManager';
import { IEventDispatcher } from '../../Events/IEventDispatcher';
import { EventDispatcher } from './EventDispatcher';
import { Event } from '../../Events/Event';
import { BaseLogger } from '../BaseLogger';
import { Logger } from './Logger';

export class Environment implements IEnvironment {
    public readonly environmentType: EnvironmentType = EnvironmentType.NodeJS;
    public argv: Array<string>;

    private communicationManager: ICommunicationManager;
    private eventDispatcher: IEventDispatcher;

    public static instance: IEnvironment;

    // tslint:disable-next-line
    private logger: BaseLogger;

    constructor() {
        this.argv = <Array<string>>process.argv;
        this.eventDispatcher = new EventDispatcher();
        Environment.instance = this;
    }

    public getCommunicationManager(): ICommunicationManager {
        if (!this.communicationManager) {
            this.communicationManager = new CommunicationManager(this, this.argv[2], Number(this.argv[3]));
        }
        return this.communicationManager;
    }

    public setupGlobalLogger() {
        this.logger = new Logger(this.getCommunicationManager());
    }

    public reinitializeConsoleLogger() {
        this.logger.overrideGlobalConsole();
    }

    public createEvent<T extends IEventArgs>(): IEvent<T> {
        return new Event<T>(this.eventDispatcher);
    }

    public exit(exitCode: number) {
        process.exit(exitCode);
    }
}