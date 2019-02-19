import { Md5 } from '../../Utils/Hashing/MD5';

export class TestCase {

    // Variable names must match with ones in c#
    // tslint:disable: variable-name
    public readonly Id: string;
    public readonly AttachmentGuid: string;
    public FullyQualifiedName: string;
    public DisplayName: string;
    public ExecutorUri: string;
    public Source: string;
    public CodeFilePath: string;
    public LineNumber: number;
    public Properties: Array<JSON>;

    constructor(source: string, fullyQualifiedName: string, executorUri: string, attachmentId?: string) {

        this.FullyQualifiedName = fullyQualifiedName;
        this.Source = source;
        this.ExecutorUri = executorUri;
        this.DisplayName = '';
        this.LineNumber = -1;
        this.Properties = [];
        this.CodeFilePath = '';

        // TODO test platform uses sha1
        const hash = new Md5();
        hash.appendStr(this.FullyQualifiedName)
            .appendStr(this.ExecutorUri)
            .appendStr(this.Source);

        this.Id = hash.getGuid();

        this.AttachmentGuid = null;
        if (attachmentId) {
            const attachmentHash = new Md5();
            attachmentHash.appendStr(attachmentId);
            this.AttachmentGuid = attachmentHash.getGuid();
        }
    }
}