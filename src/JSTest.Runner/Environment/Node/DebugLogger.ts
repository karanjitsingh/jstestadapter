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

    private defaultLogFileExtension() {
        return '.log';
    }

    private defaultLogFileName() {
        const date = new Date();
        const dateStamp = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        const timeStamp = `${date.getHours()}-${date.getMinutes()}.${date.getMilliseconds()}`;
        return `jstest.${this.processName}.${dateStamp}-${timeStamp}_${process.pid}`;
    }

    private defaultPath() {

        return path.join(process.cwd(), this.defaultLogFileName() + this.defaultLogFileExtension());
    }

    public initialize(diagFile: string) {
        let diagFilePath = '';
        
        if (!diagFile) {
            diagFilePath = this.defaultPath();
        }

        try {
            const stat = fs.lstatSync(diagFile);
            if (stat.isDirectory()) {
                diagFilePath = path.join(diagFile, this.defaultLogFileName() + this.defaultLogFileExtension());
            }
        } catch (e) {
            try {
                const dirName = path.dirname(diagFile);
                const stat = fs.lstatSync(dirName);
                if (stat.isDirectory()) {
                    diagFilePath = path.join(dirName, this.defaultLogFileName() + '-' + path.basename(diagFile));
                }
            } catch (e) {
                diagFilePath = this.defaultPath();
            }
        }

        // TODO: this is a hack for this message to display in the console
        console.error('Logging JSTet.Runner Diagnostics in file: ' + diagFilePath);
        this.logFileStream = fs.createWriteStream(diagFilePath);
    }

    public closeLogFile() {
        this.logFileStream.close();
    }

    public log(message: string) {
        this.logFileStream.write(message + '\n');
    }
}