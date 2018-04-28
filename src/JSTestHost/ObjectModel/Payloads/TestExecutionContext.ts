import { FilterOptions } from '../Common';

export interface TestExecutionContext {
    FrequencyOfRunStatsChangeEvent: number;
    RunStatsChangeEventTimeout: string;
    InIsolation: boolean;
    KeepAlive: boolean;
    AreTestCaseLevelEventsRequired: boolean;
    IsDebug: boolean;
    TestCaseFilter: string;
    FilterOptions: FilterOptions;
}