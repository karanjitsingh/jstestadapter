import { Md5 } from '../../Utils/Hashing/MD5';

export class TestCase {
    public id: string;
    public fullyQualifiedName: string;
    public displayName: string;
    public executorUri: string;
    public source: string;
    public codeFilePath: string;
    public lineNumber: number;
    public properties: Array<JSON>;

    constructor(source: string, fullyQualifiedName: string, executorUri: string) {

        this.fullyQualifiedName = fullyQualifiedName;
        this.source = source;
        this.executorUri = executorUri;
        this.displayName = '';
        this.lineNumber = -1;
        this.properties = [];
        this.codeFilePath = '';

        // TODO collision possibility
        const hash = new Md5();
        hash.appendStr(this.fullyQualifiedName)
            .appendStr(this.executorUri)
            .appendStr(this.source)
            .appendStr(new Date().getTime().toString());

        this.id = hash.end().toString();
    }
}