import { TestRunSettings } from '../';
import { TestCase } from '../Common';

export interface StartExecutionWithSourcesPayload {
    TestRunSettings: TestRunSettings;
    Sources: Array<string>;
}

export interface StartExecutionWithTestsPayload {
    TestRunSettings: TestRunSettings;
    Tests: Array<TestCase>;
}

export interface StartDiscoveryPayload {
    TestRunSettings: TestRunSettings;
    Sources: Array<string>;
}
