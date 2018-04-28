import { IXmlParser } from '../IXmlParser';
import * as parser from 'pixl-xml';

export class XmlParser implements IXmlParser {
    public convertToJson(xml: string): Object {
        return parser.parse(xml);
    }

    public convertToXml(json: Object): string {
        return parser.stringify(json);
    }
}