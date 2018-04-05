
import {default as IEnvironment, EnvironmentType} from "../IEnvironment"
import CommunicationManager from "./CommunicationManager"
import ICommunicationManager from "CommunicationUtils/ICommunicationManager";
import IEventDispatcher from "Events/IEventDispatcher";
import EventDispatcher from "./EventDispatcher";
import Event from "Events/Event";

export default class NodeEnvironment implements IEnvironment {
    public readonly environmentType: EnvironmentType = EnvironmentType.NodeJS;
    public argv: Array<string>;
    public readonly EventDispatcher: IEventDispatcher;

    constructor() {
        this.argv = <Array<string>>process.argv;
        this.EventDispatcher = new EventDispatcher();
    }

    public createCommunicationManager(): ICommunicationManager {
        return new CommunicationManager(this);
    }

    public createEvent<T>(): Event<T> {
        return new Event<T>(this.EventDispatcher)
    }
}