import IEventDispatcher from "./IEventDispatcher";

export interface IEventArgs {
}

export default class Event<TArgs extends IEventArgs> {
    private eventID: string;
    private eventDispatcher: IEventDispatcher;
    
    constructor(dispatcher) {
        this.eventDispatcher = dispatcher;
        this.eventID = this.eventDispatcher.registerEvent();
    }

    public subscribe = (handler: (sender:object, args: TArgs) => void) => this.eventDispatcher.subscribe(this.eventID, handler);

    public unsubscribe = (handler: (sender:object, args: TArgs) => void) => this.eventDispatcher.unsubscribe(this.eventID, handler);

    public raise = (sender:object, args: TArgs) => this.eventDispatcher.raise(this.eventID, sender, args);
}