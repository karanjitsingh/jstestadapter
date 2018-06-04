import { Md5 } from './MD5';

// tslint:disable:function-name 
export function SessionHash(sources: Array<string>): string {
    const hash = new Md5();
    sources.forEach(source => {
        hash.appendStr(source);
    });
    return hash.getGuid();
} 