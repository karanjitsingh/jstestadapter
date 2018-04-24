import { IEventHandler, IEventArgs } from '../ObjectModel/Common';

export abstract class IEventDispatcher {
    public abstract subscribe(eventId: string, callback: IEventHandler<IEventArgs>);
    public abstract unsubscribe(eventId: string, callback: IEventHandler<IEventArgs>);
    public abstract raise(eventId: string, sender: object, args: IEventArgs);

    private eventList: {};

    constructor() {
        this.eventList = [];
    }

    public registerEvent(): string {
        // new Date().getTime() will always generate a unique value
        const id = String((new Date()).getTime());
        this.eventList[id] = true;
        return id;
    }

    public deregisterEvent(eventId: string) {
        if (this.eventList[eventId]) {
            this.eventList[eventId] = 0;
        }
    }
}