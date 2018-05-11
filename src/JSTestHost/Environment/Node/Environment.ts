import { EnvironmentType, IEventArgs, IEvent } from '../../ObjectModel/Common';
import { IEnvironment, BaseEnvironment } from '../IEnvironment';
import { CommunicationManager } from './CommunicationManager';
import { ICommunicationManager } from '../ICommunicationManager';
import { IEventDispatcher } from '../../Events/IEventDispatcher';
import { EventDispatcher } from './EventDispatcher';
import { Event } from '../../Events/Event';

export class Environment extends BaseEnvironment {
    public readonly environmentType: EnvironmentType = EnvironmentType.NodeJS;

    constructor() {
        super();

        this.initialize(new CommunicationManager(this),
                        new EventDispatcher(),
                        process.argv,
                        Event);
    }

    protected abstract debugMessage() {
        
    }
}