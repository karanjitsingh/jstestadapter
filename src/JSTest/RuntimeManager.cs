namespace JSTest
{
    using System;
    using System.Collections.Generic;
    using System.Diagnostics;
    using System.Text;
    using System.Threading;
    using System.Threading.Tasks;
    using JSTest.Communication;
    using JSTest.Communication.Payloads;
    using JSTest.Interfaces;
    using JSTest.Settings;
    using Microsoft.VisualStudio.TestPlatform.ObjectModel;
    using Microsoft.VisualStudio.TestPlatform.PlatformAbstractions;
    using Microsoft.VisualStudio.TestPlatform.PlatformAbstractions.Interfaces;

    internal class TestRuntimeManager
    {
        private readonly JSTestSettings settings;
        private readonly ManualResetEventSlim versionCheckComplete;
        private readonly ManualResetEventSlim executionComplete;

        private readonly JSProcess jsProcess;
        private readonly JsonDataSerializer dataSerializer;
        private readonly TestRunEvents testRunEvents;

        protected int ErrorLength { get; set; } = 4096;

        public TestRuntimeManager(JsonDataSerializer dataSerializer, IProcessHelper processHelper, JSProcess process)
        {
            this.dataSerializer = dataSerializer;
            this.jsProcess = process;
            this.versionCheckComplete = new ManualResetEventSlim();
            this.executionComplete = new ManualResetEventSlim();
        }

        public TestRuntimeManager(JSTestSettings settings, TestRunEvents testRunEvents)
            : this(JsonDataSerializer.Instance, new ProcessHelper(), new JSProcess())
        {
            this.settings = settings;
            this.testRunEvents = testRunEvents;

            if (this.settings.DebugLogs)
            {
                this.jsProcess.EnableDebugLogs(this.settings.DebugFilePath);
            }
        }

        public int GetProcessId()
        {
            return this.jsProcess.ProcessId;
        }

        private Action<object> ProcessExitReceived => (process) =>
        {
            if (this.executionComplete.IsSet)
            {
                this.testRunEvents.InvokeTestSessionEnd(this);
                throw new JSTestException("JavaScript runtime quit unexpectedly.");
            }
        };

        private Action<object, string> ProcessOutputReceived => (process, data) =>
        {
            EqtTrace.Verbose("RuntimeManager: Node {0} StdOut: {1}", this.jsProcess.ProcessId, data);

            if (!string.IsNullOrEmpty(data))
            {
                Console.WriteLine("JSTest: {0} StdOut: {1}", this.jsProcess.ProcessId, data);
            }
        };

        private Action<object, string> ProcessErrorReceived => (process, data) =>
        {
            EqtTrace.Error("RuntimeManager: Node {0} StdErr: {1}", this.jsProcess.ProcessId, data);
            
            if (!string.IsNullOrEmpty(data))
            {
                Console.WriteLine("JSTest: {0} StdErr: {1}", this.jsProcess.ProcessId, data);
            }
        };
        
        public Task CleanProcessAsync()
        {
            try
            {
                this.jsProcess.TerminateProcess();
            }
            catch (Exception ex)
            {
                EqtTrace.Warning("RuntimeManager: Unable to terminate test host process: " + ex);
            }

            return Task.FromResult(true);
        }

        public async Task<bool> LaunchProcessAsync(TestProcessStartInfo runtimeProcessStartInfo, CancellationToken cancellationToken)
        {
            return await Task.Run(() =>
            {
                try
                {
                    EqtTrace.Verbose("RuntimeManager: Starting process '{0}' with command line '{1}'", runtimeProcessStartInfo.FileName, runtimeProcessStartInfo.Arguments);

                    cancellationToken.ThrowIfCancellationRequested();

                    var callbacks = new ProcessCallbacks
                    {
                        outputReceived = this.ProcessOutputReceived,
                        errorReceived = this.ProcessErrorReceived,
                        exitReceived = this.ProcessExitReceived
                    };

                    this.jsProcess.LaunchProcess(runtimeProcessStartInfo, callbacks);

                }
                catch (OperationCanceledException ex)
                {
                    EqtTrace.Error("RuntimeManager: Failed to launch node: {0}", ex);
                    Console.WriteLine(ex);
                    return false;
                }

                this.InitializeCommunication(cancellationToken);
                return this.jsProcess.IsAlive;
            });
        }

        public void SendStartExecution(IEnumerable<string> sources)
        {
            var payload = new StartExecutionWithSourcesPayload() { Sources = sources };
            this.jsProcess.CommunicationChannel.SendMessage(MessageType.StartTestExecutionWithSources, payload);
        }

        public void SendStartExecution(IEnumerable<TestCase> tests)
        {
            var payload = new StartExecutionWithTestsPayload() { Tests = tests };
            this.jsProcess.CommunicationChannel.SendMessage(MessageType.StartTestExecutionWithTests, payload);
        }

        public void SendStartDiscovery(IEnumerable<string> sources)
        {
            var payload = new StartDiscoveryPayload() { Sources = sources };
            this.jsProcess.CommunicationChannel.SendMessage(MessageType.StartDiscovery, payload);
        }

        private void InitializeCommunication(CancellationToken cancellationToken)
        {
            if (jsProcess.IsAlive)
            {
                EqtTrace.Verbose("RuntimeManager: Initializing communication with client process.");
                var connectionStopwatch = Stopwatch.StartNew();
                
                // Start the message loop
                Task.Run(() => { this.MessageLoopAsync(this.jsProcess.CommunicationChannel, cancellationToken); });
                this.jsProcess.CommunicationChannel.SendMessage(MessageType.TestRunSettings, settings);

                this.versionCheckComplete.Wait();

                connectionStopwatch.Stop();
                Console.WriteLine("JSTest: Connected to process with id {0}, time taken {1}.", jsProcess.ProcessId, connectionStopwatch.ElapsedMilliseconds);
            }
        }

        private Task MessageLoopAsync(CommunicationChannel channel, CancellationToken cancellationToken)
        {
            // Set read timeout to avoid blocking receive raw message
            while (channel != null && !cancellationToken.IsCancellationRequested && this.jsProcess.IsAlive && !this.executionComplete.IsSet)
            {
                try
                {
                    var task = channel.ReceiveMessageAsync(cancellationToken);
                    task.Wait();

                    this.OnMessageReceived(task.Result);
                }
                catch (Exception exception)
                {
                    EqtTrace.Error("RuntimeManager: Communication error: {0}", exception);
                    Console.Error.WriteLine("JSTest: Communucation error: {0}", exception.Message);
                }
            }

            return Task.FromResult(0);
        }

        private void OnMessageReceived(Message message)
        {
            switch (message.MessageType)
            {
                case MessageType.VersionCheck:
                    var version = this.dataSerializer.DeserializePayload<int>(message);

                    if (version != Constants.MessageProtocolVersion)
                    {
                        throw new JSTestException("Unsupported javascript runner version.");
                    }
                    else
                    {
                        this.versionCheckComplete.Set();
                    }

                    break;

                case MessageType.TestCaseFound:
                    var testFoundPayload = this.dataSerializer.DeserializePayload<TestCaseFoundEventArgs>(message);
                    this.testRunEvents.InvokeTestCaseFound(this, testFoundPayload);
                    break;

                case MessageType.TestCaseStart:
                    var testStartPayload = this.dataSerializer.DeserializePayload<TestCaseStartEventArgs>(message);
                    this.testRunEvents.InvokeTestCaseStart(this, testStartPayload);
                    break;

                case MessageType.TestCaseEnd:
                    var testEndPayload = this.dataSerializer.DeserializePayload<TestCaseEndEventArgs>(message);
                    this.testRunEvents.InvokeTestCaseEnd(this, testEndPayload);
                    break;

                case MessageType.ExecutionComplete:
                case MessageType.DiscoveryComplete:
                    this.executionComplete.Set();
                    this.testRunEvents.InvokeTestSessionEnd(this);
                    break;

                case MessageType.TestMessage:
                    var messagePayload = this.dataSerializer.DeserializePayload<TestMessagePayload>(message);
                    this.testRunEvents.InvokeMessageReceived(this, messagePayload);
                    break;

                case MessageType.ConsoleMessage:
                    var consolePayload = this.dataSerializer.DeserializePayload<TestMessagePayload>(message);
                    this.testRunEvents.InvokeMessageReceived(this, consolePayload);
                    break;

                case MessageType.RunAttachments:
                    var attachmentsPayload = this.dataSerializer.DeserializePayload<TestRunAttachmentPayload>(message);
                    this.testRunEvents.InvokeTestRunAttachmentReceived(this, attachmentsPayload);
                    break;

                default:
                    Console.WriteLine("JSTest: Unknown message type {0} with payload {1}", message.MessageType, message.Payload);
                    break;
            }

        }
    }
}
