import { EnvironmentType, IEventArgs, IEvent } from '../../ObjectModel/Common';
import { IEnvironment } from '../IEnvironment';
import { CommunicationManager } from './CommunicationManager';
import { ICommunicationManager } from '../ICommunicationManager';
import { IEventDispatcher } from '../../Events/IEventDispatcher';
import { EventDispatcher } from './EventDispatcher';
import { Event } from '../../Events/Event';

export class Environment implements IEnvironment {
    public readonly environmentType: EnvironmentType = EnvironmentType.NodeJS;
    public argv: Array<string>;
    
    private eventDispatcher: IEventDispatcher;

    constructor() {
        this.argv = <Array<string>>process.argv;
        this.eventDispatcher = new EventDispatcher();
    }

    public createCommunicationManager(): ICommunicationManager {
        return new CommunicationManager(this);
    }

    public createEvent<T extends IEventArgs>(): IEvent<T> {
        return new Event<T>(this.eventDispatcher);
    }
}