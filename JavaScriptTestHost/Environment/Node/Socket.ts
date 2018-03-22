import ISocket from "../ISocket";

declare var require: any;

export default class Socket implements ISocket {
    private client;

    constructor() {
        let net = require("net");
        this.client = new net.Socket();
    }
    
    public connect(port: number, ip:string, callback: () => void) {
        this.client.connect(port, ip, callback);
    }

    public onDataReceived(callback: (data:string) => void) {
        this.client.on('data', callback);
    }

    public onConnectionClose(callback: () => {}) {
        this.client.on('close', callback);
    }
}