import { IXmlParser } from '../Environment/IXmlParser';
import { Constants } from '../ObjectModel';

export class RunSettings {
    public readonly runSettingsXml: string;
    private readonly runSettings: Object;

    constructor(runSettingsXml: string, xmlParser: IXmlParser) {
        this.runSettings = xmlParser.convertToJson(runSettingsXml);
        this.runSettingsXml = runSettingsXml;
    }

    public isDataCollectionEnabled(): boolean {
        try {
            if (this.runSettings[Constants.DataCollectionRunSettingsName]) {
                if (this.runSettings[Constants.DataCollectionRunSettingsName][Constants.DataCollectorsSettingName]) {
                    const dataCollectors = this.runSettings[Constants.DataCollectionRunSettingsName][Constants.DataCollectorsSettingName];
                    return Object.keys(dataCollectors).length > 0;
                }
            }
        } catch (e) {
            return false;
        }
        return false;
    }
 }