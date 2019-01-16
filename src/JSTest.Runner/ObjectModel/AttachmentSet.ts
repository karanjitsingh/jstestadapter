// tslint:disable:variable-name
export interface AttachmentSet {
    Uri: string;
    DisplayName: string;
    Attachments: Array<UriDataAttachment>;
}

export interface UriDataAttachment {
    Description: string;
    Uri: string;
}
