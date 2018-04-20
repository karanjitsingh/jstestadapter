
import { IEnvironment, EnvironmentType} from '../IEnvironment';
import { CommunicationManager } from './CommunicationManager';
import { ICommunicationManager } from '../../Utils/ICommunicationManager';
import { IEventDispatcher } from '../../Events/IEventDispatcher';
import { EventDispatcher } from './eventDispatcher';
import { Event } from '../../Events/Event';

export class Environment implements IEnvironment {
    public readonly environmentType: EnvironmentType = EnvironmentType.NodeJS;
    public argv: Array<string>;
    public readonly eventDispatcher: IEventDispatcher;

    constructor() {
        this.argv = <Array<string>>process.argv;
        this.eventDispatcher = new EventDispatcher();
    }

    public createCommunicationManager(): ICommunicationManager {
        return new CommunicationManager(this);
    }

    public createEvent<T>(): Event<T> {
        return new Event<T>(this.eventDispatcher);
    }
}