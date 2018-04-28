import { IXmlParser } from '../Environment/IXmlParser';
import { Constants } from 'ObjectModel';

export class RunSettings {
    public readonly runSettingsXml: string;
    private readonly runSettings: Object;

    constructor(runSettingsXml: string, xmlParser: IXmlParser) {
        this.runSettings = xmlParser.convertToJson(runSettingsXml);
        this.runSettingsXml = runSettingsXml;
    }

    public isDataCollectionEnabled(): boolean {
        if (this.runSettings[Constants.DataCollectionRunSettingsName]) {
            if (this.runSettings[Constants.DataCollectionRunSettingsName][Constants.DataCollectorsSettingName]) {
                const dataCollectors = this.runSettings[Constants.DataCollectionRunSettingsName][Constants.DataCollectorsSettingName];
                return dataCollectors.length;
            }
        }
    }
 }