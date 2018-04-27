import { IXmlParser } from '../IXmlParser';
import * as parser from 'xml2js'; 

export class XmlParser implements IXmlParser {
    public convertToJson(xml: string): Object {
        return parser.toJson(xml);
    }

    public convertToXml(json: Object): string {
        return parser.toXml(json);
    }
}