import TestCase from "../TestCase";
import { IEventArgs } from "Events/Event";

export default interface TestsDiscoveredEventArgs extends IEventArgs {
    DiscoveredTests: Array<TestCase>,
    TotalTestsDiscovered: number
};
