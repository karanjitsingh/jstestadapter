import { ISerializable } from '../Utils/ISerializable';

export class Attachment implements ISerializable {
    private uri: string;
    private description: string;

    constructor(uri: string, description: string) {
        this.uri = uri;
        this.description = description;
    }

    public toJSON(): Object {
        return {
            Uri: this.uri,
            Description: this.description
        };
    }
}