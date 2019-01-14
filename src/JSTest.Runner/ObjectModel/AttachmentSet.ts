// tslint:disable:variable-name
export interface AttachmentSet {
    Uri: string;
    DisplayName: string;
    Attachments: Array<{
        Description: string,
        Uri: string
    }>;
}