import { TestOutcome } from "./TestOutcome";

export interface TestRunStatistics
{
    Stats: { [testOutcome: number] : number; };
    ExecutedTests: number;
}