import { Md5 } from "Utils/Hashing/MD5";

export default class TestCase {
    public Id: string;
    public FullyQualifiedName: string;
    public DisplayName: string;
    public ExecutorUri: string;
    public Source: string;
    public CodeFilePath: string;
    public LineNumber: number;
    public Properties: Array<JSON>;

    constructor(source:string, fullyQualifiedName: string, executorUri: string) {
        
        this.FullyQualifiedName = fullyQualifiedName;
        this.Source = source;
        this.ExecutorUri = executorUri;
        this.DisplayName = "";
        this.LineNumber = -1;
        this.Properties = [];
        this.CodeFilePath = "";

        // TODO collision possibility
        let hash = new Md5();
        hash.appendStr(this.FullyQualifiedName)
            .appendStr(this.ExecutorUri)
            .appendStr(this.Source);

        this.Id = hash.end().toString();
    }
}