import { ISerializable } from '../Utils/ISerializable';

export class Attachment implements ISerializable {
    private uri: string;
    private description: string;

    constructor(url: string, description: string) {
        this.uri = this.getFileUrl(url);
        this.description = description;
    }

    public toJSON(): Object {
        return {
            Uri: this.uri,
            Description: this.description
        };
    }

    private getFileUrl(url: string): string {
        let pathName = url.replace(/\\/g, '/');
    
        // Windows drive letter must be prefixed with a slash
        if (pathName[0] !== '/') {
            pathName = '/' + pathName;
        }
    
        return encodeURI('file://' + pathName);
    }
}