export default interface TestCase {
    Id: string,
    FullyQualifiedName: string,
    DisplayName: string,
    ExecutorUri: string,
    Source: string,
    CodeFilePath: string,
    LineNumber: number,
    Properties: Array<JSON>
}