import { EnvironmentType } from '../Common/EnvironmentType';
import { ITestFrameworkEvents } from './ITestFrameworkEvents';

export interface ITestFramework {
    readonly executorUri: string;
    readonly environmentType: EnvironmentType;
    testFrameworkEvents: ITestFrameworkEvents;

    startExecution(source: string): void;
    startDiscovery(source: string): void;
}