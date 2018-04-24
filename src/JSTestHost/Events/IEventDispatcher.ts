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
        let id = '';

        // sometimes new Date().getTime() fails to generate a string
        while (id === '' || this.eventList[id]) {
            id = String((new Date()).getTime());
        }

        this.eventList[id] = true;
        return id;
    }

    public deregisterEvent(eventId: string) {
        if (this.eventList[eventId]) {
            this.eventList[eventId] = 0;
        }
    }
}