export enum MessageType {
    VersionCheck = 'ProtocolVersion',
    TestRunSettings = 'JSTest.TestRunSettings',
    TestCaseFound = 'JSTest.TestCaseFound',
    TestCaseStart = 'JSTest.TestCaseStart',
    TestCaseEnd = 'JSTest.TestCaseEnd',
    DiscoveryComplete = 'JSTest.DiscoveryComplete',
    ExecutionComplete = 'JSText.ExecutionComplete',
    TestRunRequest = 'JSTest.TestRunRequest',
    TestMessage = 'JSTest.TestMessage',
    StartTestExecutionWithSources = 'JSTest.StartWithSources',
    StartTestExecutionWithTests = 'JSTest.StartWithTests',
    StartDiscovery = 'JSTest.StartDiscovery'
}