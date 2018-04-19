import { IEventArgs, IEventHandler } from './Event';

export abstract class IEventDispatcher {
    public abstract subscribe(eventId: string, callback: IEventHandler<IEventArgs>);
    public abstract unsubscribe(eventId: string, callback: IEventHandler<IEventArgs>);
    public abstract raise(eventId: string, sender: object, args: IEventArgs);

    private eventList: {};

    constructor() {
        this.eventList = [];
    }

    public registerEvent(): string {
        let id = '';

        // TODO potentially dangerous
        while (id === '' || this.eventList[id]) {
            id = String((new Date()).getTime());
        }

        this.eventList[id] = true;
        return id;

    }

    public deregisterEvent(eventId: string) {
        if (this.eventList[eventId]) {
            delete this.eventList[eventId];
        }
    }
}