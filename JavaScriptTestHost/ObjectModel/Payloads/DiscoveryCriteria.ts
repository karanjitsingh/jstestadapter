export interface DiscoveryCriteria {
    Package: string;
    AdapterSourceMap: {[key: string]: Array<string>};
    FrequencyOfDiscoveredTestsEvent: number;
    DiscoveredTestEventTimeout: string;
    RunSettings: string;
    TestCaseFilter: string;
}