import * as Assert from 'assert';
import { IDebugLogger } from '../../src/JSTest.Runner/ObjectModel/EqtTrace';

export namespace TestUtils {
    export function assertDeepEqual(x: any, y: any): boolean {
        try { 
            Assert.deepEqual(x, y);
            return true;
        } catch (e) {
            return false;
        }
    }

    export class MockDebugLogger implements IDebugLogger {
        public readonly processPid: number;
        public traceFilePath: string;
        public logs: Array<string> = [];

        constructor(pid?: number) {
            this.processPid = pid || 0;
        }

        public initialize(traceFilePath: string) {
            this.traceFilePath = traceFilePath;    
        }

        public log(message: string) {
            this.logs.push(message);
        }

        public logContains(log: string) {
            this.logs.forEach(value => {
                if (value === log) {
                    return true;
                }
            });
            return false;
        }
    }
}