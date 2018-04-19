export enum MessageType {
    /// <summary>
    /// The session start.
    /// </summary>
    SessionStart = 'TestSession.Start',

    /// <summary>
    /// The session end.
    /// </summary>
    SessionEnd = 'TestSession.Terminate',

    /// <summary>
    /// The is aborted.
    /// </summary>
    SessionAbort = 'TestSession.Abort',

    /// <summary>
    /// The session connected.
    /// </summary>
    SessionConnected = 'TestSession.Connected',

    /// <summary>
    /// Test Message
    /// </summary>
    TestMessage = 'TestSession.Message',

    /// <summary>
    /// Protocol Version
    /// </summary>
    VersionCheck = 'ProtocolVersion',

    /// <summary>
    /// Protocol Error
    /// </summary>
    ProtocolError = 'ProtocolError',

    /// <summary>
    /// The session start.
    /// </summary>
    DiscoveryInitialize = 'TestDiscovery.Initialize',

    /// <summary>
    /// The discovery started.
    /// </summary>
    StartDiscovery = 'TestDiscovery.Start',

    /// <summary>
    /// The test cases found.
    /// </summary>
    TestCasesFound = 'TestDiscovery.TestFound',

    /// <summary>
    /// The discovery complete.
    /// </summary>
    DiscoveryComplete = 'TestDiscovery.Completed',

    /// <summary>
    /// The session start.
    /// </summary>
    ExecutionInitialize = 'TestExecution.Initialize',

    /// <summary>
    /// Cancel the current test run
    /// </summary>
    CancelTestRun = 'TestExecution.Cancel',

    /// <summary>
    /// Cancel the current test run
    /// </summary>
    AbortTestRun = 'TestExecution.Abort',

    /// <summary>
    /// Start test execution.
    /// </summary>
    StartTestExecutionWithSources = 'TestExecution.StartWithSources',

    /// <summary>
    /// Start test execution.
    /// </summary>
    StartTestExecutionWithTests = 'TestExecution.StartWithTests',

    /// <summary>
    /// The test run stats change.
    /// </summary>
    TestRunStatsChange = 'TestExecution.StatsChange',

    /// <summary>
    /// The execution complete.
    /// </summary>
    ExecutionComplete = 'TestExecution.Completed',

    /// <summary>
    /// The message to get runner process startInfo for run all tests in given sources
    /// </summary>
    GetTestRunnerProcessStartInfoForRunAll = 'TestExecution.GetTestRunnerProcessStartInfoForRunAll',

    /// <summary>
    /// The message to get runner process startInfo for run selected tests
    /// </summary>
    GetTestRunnerProcessStartInfoForRunSelected = 'TestExecution.GetTestRunnerProcessStartInfoForRunSelected',

    /// <summary>
    /// CustomTestHostLaunch
    /// </summary>
    CustomTestHostLaunch = 'TestExecution.CustomTestHostLaunch',

    /// <summary>
    /// Custom Test Host launch callback
    /// </summary>
    CustomTestHostLaunchCallback = 'TestExecution.CustomTestHostLaunchCallback',

    /// <summary>
    /// Extensions Initialization
    /// </summary>
    ExtensionsInitialize = 'Extensions.Initialize',

    /// <summary>
    /// Start Test Run All Sources
    /// </summary>
    TestRunAllSourcesWithDefaultHost = 'TestExecution.RunAllWithDefaultHost',

    /// <summary>
    ///  Start Test Run - Testcases
    /// </summary>
    TestRunSelectedTestCasesDefaultHost = 'TestExecution.RunSelectedWithDefaultHost',

    /// <summary>
    /// Launch Adapter Process With DebuggerAttached
    /// </summary>
    LaunchAdapterProcessWithDebuggerAttached = 'TestExecution.LaunchAdapterProcessWithDebuggerAttached',

    /// <summary>
    /// Launch Adapter Process With DebuggerAttached
    /// </summary>
    LaunchAdapterProcessWithDebuggerAttachedCallback = 'TestExecution.LaunchAdapterProcessWithDebuggerAttachedCallback',

    /// <summary>
    /// Data Collection Message
    /// </summary>
    DataCollectionMessage = 'DataCollection.SendMessage',

    // #region DataCollector messages

    /// <summary>
    /// Event message type sent to datacollector process right after test host process has started.
    /// </summary>
    TestHostLaunched = 'DataCollection.TestHostLaunched',

    /// <summary>
    /// Event message type send to datacollector process before test run starts.
    /// </summary>
    BeforeTestRunStart = 'DataCollection.BeforeTestRunStart',

    /// <summary>
    /// Event message type used by datacollector to send results  after receiving test run start event.
    /// </summary>
    BeforeTestRunStartResult = 'DataCollection.BeforeTestRunStartResult',

    /// <summary>
    /// Event message type send to datacollector process after test run ends.
    /// </summary>
    AfterTestRunEnd = 'DataCollection.AfterTestRunEnd',

    /// <summary>
    /// Event message type used by dastacollector to send result on receiving test run end event.
    /// </summary>
    AfterTestRunEndResult = 'DataCollection.AfterTestRunEndResult',

    /// <summary>
    /// Event message type send to datacollector process before test case execution starts.
    /// </summary>
    DataCollectionTestStart = 'DataCollection.TestStart',

    /// <summary>
    /// Event message type used to signal datacollector process that test case execution has ended.
    /// </summary>
    DataCollectionTestEnd = 'DataCollection.TestEnd',

    /// <summary>
    /// Event message type used by datacollector to send result on receiving TestEnd.
    /// </summary>
    DataCollectionTestEndResult = 'DataCollection.TestEndResult',

    /// <summary>
    /// Ack Event message type send to datacollector process before test case execution starts.
    /// </summary>
    DataCollectionTestStartAck = 'DataCollection.TestStartAck'

    // #endregion
}