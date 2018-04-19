import { IEventDispatcher } from './IEventDispatcher';

// tslint:disable-next-line
export interface IEventArgs {
}

export type IEventHandler<Targs extends IEventArgs> = (sender: object, args: Targs) => void;

export class Event<TArgs extends IEventArgs> {
    private eventID: string;
    private eventDispatcher: IEventDispatcher;

    constructor(dispatcher: IEventDispatcher) {
        this.eventDispatcher = dispatcher;
        this.eventID = this.eventDispatcher.registerEvent();
    }

    public subscribe = (handler: IEventHandler<TArgs>) => this.eventDispatcher.subscribe(this.eventID, handler);

    public unsubscribe = (handler: IEventHandler<TArgs>) => this.eventDispatcher.unsubscribe(this.eventID, handler);

    public raise = (sender: object, args: TArgs) => this.eventDispatcher.raise(this.eventID, sender, args);
}