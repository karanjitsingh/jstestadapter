import { ISerializable } from '../Utils/ISerializable';

// TODO Attachments
export class AttachmentSet implements ISerializable {
    private obj: Object;

    constructor(object: Object) {
        this.obj = object;
    }

    public toJSON() {
        return this.obj;
    }
}