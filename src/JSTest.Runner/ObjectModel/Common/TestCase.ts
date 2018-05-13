import { Md5 } from '../../Utils/Hashing/MD5';

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

    constructor(source: string, fullyQualifiedName: string, executorUri: string, localIdentifier?: string) {

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

        this.Id = this.toGUIDFormat(hash.end().toString());
    }

    private toGUIDFormat(hash: string): string {
        const m = hash.match(/(.{8})(.{4})(.{4})(.{4})(.{12})/);
        return `${m[1]}-${m[2]}-${m[3]}-${m[4]}-${m[5]}`;
    }
}