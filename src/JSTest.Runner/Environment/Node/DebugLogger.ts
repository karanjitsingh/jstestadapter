import { IDebugLogger } from '../../ObjectModel/EqtTrace';
import * as fs from 'fs';
import * as path from 'path';

export class DebugLogger implements IDebugLogger {
    private logFileStream: fs.WriteStream;

    constructor() {
        const diagFile = path.join(process.cwd(), `jstest.runner.${ new Date().toString().replace(/\:/g, '-')}_${process.pid}.log`);
        console.log('Logging JSTet.Runner Diagnostics in file: ' + diagFile);
        this.logFileStream = fs.createWriteStream(diagFile);
    }

    public log(message: string) {
        this.logFileStream.write(message);
    }
}