export default interface Socket {
    connect(port: number, ip:string, callback: () => void);
    onDataReceived(callback: (data: string) => void);
    onConnectionClose(callback: () => {});
}