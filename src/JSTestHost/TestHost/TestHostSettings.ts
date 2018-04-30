import { SupportedFramework } from './TestFrameworks/TestFrameworkFactory';

export interface TestHostSettings {
    TestFramework: SupportedFramework;
    Port: number;
    EndpointIP: string;
    Role: string;
    PPID: number;
    LogFile: string;
    DataCollectionPort: number;
    TelemetryOptedIn: boolean;
}