export interface IXmlParser {
    convertToJson(xml: string): Object;
    convertToXml(json: Object): string;
}