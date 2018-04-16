import TestCase from "../TestCase";
import ISerializable from "../ISerializable";

export default class DiscoveryCompletePayload {
    TotalTests: number;
    LastDiscoveredTests: Array<TestCase>;
    IsAborted: boolean;
    Metrics: {[id:string]: ISerializable};
}