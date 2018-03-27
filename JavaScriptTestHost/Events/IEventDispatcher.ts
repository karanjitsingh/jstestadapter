export default abstract class IEventDispatcher {
    abstract subscribe(eventId: string, callback: (args) => void);
    abstract unsubscribe(eventId: string, callback: (args) => void);
    abstract dispatch(eventId: string);
    
    private eventList: JSON;
    
    public registerEvent() {
        let id = (new Date()).getTime();
        this.eventList[id] = 1;
    }

    public deregisterEvent(eventId: string) {
        if(this.eventList[eventId]) {
            delete this.eventList[eventId];
        }
    }

}

