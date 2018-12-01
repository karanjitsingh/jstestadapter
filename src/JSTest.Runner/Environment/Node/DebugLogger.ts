import { IDebugLogger } from '../../ObjectModel/EqtTrace';
import * as fs from 'fs';
import * as path from 'path';

export class DebugLogger implements IDebugLogger {
    private logFileStream: fs.WriteStream;
    public readonly processPid: number;
    public readonly processName: string = 'node';

    constructor() {
        this.processPid = process.pid;
    }

    private defaultPath() {
        const date = new Date();
        const dateStamp = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        const timeStamp = `${date.getHours()}-${date.getMinutes()}.${date.getMilliseconds()}`;
    
        return path.join(process.cwd(), `jstest.${this.processName}.${dateStamp}-${timeStamp}_${process.pid}.log`);
    }

    public initialize(diagFile: string) {
        if (!diagFile) {
            diagFile = this.defaultPath();
        }
        this.logFileStream = fs.createWriteStream(diagFile);
        console.log('Logging JSTet.Runner Diagnostics in file: ' + diagFile);
    }

    public closeLogFile() {
        this.logFileStream.close();
    }

    public log(message: string) {
        this.logFileStream.write(message + '\n');
    }
}