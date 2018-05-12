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

    private eventDispatcher: IEventDispatcher;

    // tslint:disable-next-line
    private logger: BaseLogger;

    constructor() {
        this.eventDispatcher = new EventDispatcher();
        this.logger = new Logger(this.getCommunicationManager());
        this.argv = <Array<string>>process.argv;
    }

    public getCommunicationManager(): ICommunicationManager {
        return new CommunicationManager(this);
    }

    public createEvent<T extends IEventArgs>(): IEvent<T> {
        return new Event<T>(this.eventDispatcher);
    }

    public exit(exitCode: number) {
        process.exit(exitCode);
    }
}