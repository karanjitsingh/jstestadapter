import { IDebugLogger } from '../../ObjectModel/EqtTrace';
import * as fs from 'fs';
import * as path from 'path';
import { GetTimeStamp } from '../../Utils/TimeUtils';

export class DebugLogger implements IDebugLogger {
    private logFileStream: fs.WriteStream;
    private messageBuffer: Array<string> = [];
    private logFileCreated: boolean;

    public readonly processPid: number;
    public readonly processName: string = 'node';
    
    constructor() {
        this.processPid = process.pid;
    }

    private defaultLogFileExtension() {
        return '.log';
    }

    private defaultLogFileName() {
        const [dateStamp, timeStamp] = GetTimeStamp('-', '.');
        return `jstest.${this.processName}.${dateStamp}-${timeStamp}_${process.pid}`;
    }

    private defaultPath() {
        return path.join(process.cwd(), this.defaultLogFileName() + this.defaultLogFileExtension());
    }

    public initialize(diagFile: string) {
        let diagFilePath = '';
        
        if (diagFile) {
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
        } else {
            diagFilePath = this.defaultPath();
        }

        this.logFileStream = fs.createWriteStream(diagFilePath);

        this.logFileStream.on('open', () => {
            this.messageBuffer.forEach(message => {
                this.logFileStream.write(message + '\n');
            });
            this.messageBuffer = [];
            this.logFileCreated = true;
        });

        console.log('Logging JSTet.Runner Diagnostics in file: ' + diagFilePath);
    }

    public closeLogFile() {
        this.logFileStream.close();
    }

    public log(message: string) {
        if (this.logFileCreated) {
            this.logFileStream.write(message + '\n');
        } else {
            this.messageBuffer.push(message);
        }
    }
}
