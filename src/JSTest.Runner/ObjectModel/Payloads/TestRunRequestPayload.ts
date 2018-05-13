import { JSTestSettings } from '../';
import { TestCase } from '../Common';

export interface StartExecutionWithSourcesPayload {
    TestRunSettings: JSTestSettings;
    Sources: Array<string>;
}

export interface StartExecutionWithTestsPayload {
    TestRunSettings: JSTestSettings;
    Tests: Array<TestCase>;
}

export interface StartDiscoveryPayload {
    TestRunSettings: JSTestSettings;
    Sources: Array<string>;
}
