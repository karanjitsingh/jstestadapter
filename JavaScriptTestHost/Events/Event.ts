import IEventDispatcher from "./IEventDispatcher";

export class EventArgs {
    sender: object;
}

export default class Event {
    private eventID: string;
    private eventDispatcher: IEventDispatcher;
    
    constructor(dispatcher) {
        this.eventDispatcher = dispatcher;
        this.eventID = this.eventDispatcher.registerEvent();
    }

    public subscribe = (handler: (args: EventArgs) => void) => this.eventDispatcher.subscribe(this.eventID, handler);

    public unsubscribe = (handler: (args: EventArgs) => void) => this.eventDispatcher.unsubscribe(this.eventID, handler);

    public raise = (args: EventArgs) => this.eventDispatcher.raise(this.eventID, args);
}