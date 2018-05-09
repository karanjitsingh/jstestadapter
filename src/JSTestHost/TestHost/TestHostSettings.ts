import { TestFrameworks } from '../ObjectModel/TestFramework';

export interface TestHostSettings {
    TestFramework: TestFrameworks;
    Port: number;
    EndpointIP: string;
    Role: string;
    PPID: number;
    LogFile: string;
    DataCollectionPort: number;
    TelemetryOptedIn: boolean;
}