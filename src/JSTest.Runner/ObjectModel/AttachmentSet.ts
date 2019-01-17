import { ISerializable } from '../Utils/ISerializable';
import { Attachment } from './Attachment';

export class AttachmentSet implements ISerializable {
    private uri: string;
    private displayName: string;
    private attachments: Array<Attachment>;

    constructor(uri: string, displayName: string) {
        this.uri = uri;
        this.displayName = displayName;
        this.attachments = [];
    }

    public addAttachment(uri: string, description?: string): void {
        this.attachments.push(new Attachment(uri, description || ''));
    }

    public toJSON() {
        return {
            Uri: this.uri,
            DisplayName: this.displayName,
            Attachments: this.attachments.map(a => a.toJSON())
        };
    }
}