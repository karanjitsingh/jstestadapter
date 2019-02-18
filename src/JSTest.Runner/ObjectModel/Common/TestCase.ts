import * as path from 'path';
import * as fs from 'fs';
import { Md5 } from '../../Utils/Hashing/MD5';
import { AttachmentSet } from '../AttachmentSet';
import { EqtTrace } from '../../ObjectModel/EqtTrace';

export class TestCase {

    // Variable names must match with ones in c#
    // tslint:disable: variable-name
    public readonly Id: string;
    public FullyQualifiedName: string;
    public DisplayName: string;
    public ExecutorUri: string;
    public Source: string;
    public CodeFilePath: string;
    public LineNumber: number;
    public Properties: Array<JSON>;

    private AttachmentGuid: string;

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

    /**
     * Looks for files to upload under the specified folder using test case specific id.
     * 
     * @param attachmentsRootFolder Root folder of the attachments.
     */
    public getAttachments(attachmentsRootFolder: string): AttachmentSet[] {
        const attachments = new Array<AttachmentSet>();

        // Lets see any file exists in the attachments folder upload
        if (attachmentsRootFolder && this.AttachmentGuid) {
            try {
                const attachmentsFolder = path.join(attachmentsRootFolder, this.AttachmentGuid);
                if (fs.lstatSync(attachmentsFolder).isDirectory()) {
                    let attachmentSet: AttachmentSet = null;

                    // Iterate through the files under attachments folder to get the list of attachments
                    fs.readdirSync(attachmentsFolder).forEach(file => {
                        const filePath = path.join(attachmentsFolder, file);
                        const fileStats = fs.lstatSync(filePath);
                        if (fileStats.isFile()) {
                            EqtTrace.info(`TestCase.getAttachments: adding set ${this.ExecutorUri}`);

                            // Ensure top level attachment set
                            if (!attachmentSet) {
                                attachmentSet = new AttachmentSet(this.ExecutorUri, 'Attachments');
                                attachments.push(attachmentSet);
                            }

                            EqtTrace.info(`TestCase.getAttachments: adding attachment ${filePath}`);

                            // Add current file as attachment
                            attachmentSet.addAttachment(filePath);
                        }
                    });
                }
            }
            catch (e) {
                EqtTrace.error(`Error while getting attachments from ${attachmentsRootFolder} for ${this.AttachmentGuid}`, e);
                return new Array<AttachmentSet>();
            }
        }

        return attachments;
    }
}