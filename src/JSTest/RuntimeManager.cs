namespace JSTest
{
    using System;
    using System.Collections.Generic;
    using System.Text;
    using System.Threading;
    using System.Threading.Tasks;

    using Microsoft.VisualStudio.TestPlatform.ObjectModel;
    using Microsoft.VisualStudio.TestPlatform.ObjectModel.Host;
    using Microsoft.VisualStudio.TestPlatform.ObjectModel.Logging;
    using Microsoft.VisualStudio.TestPlatform.PlatformAbstractions;
    using Microsoft.VisualStudio.TestPlatform.PlatformAbstractions.Interfaces;

    using JSTest.Communication;
    using JSTest.Communication.Payloads;
    using JSTest.Settings;
    using System.Diagnostics;

    internal class TestRuntimeManager
    {
        private JSTestSettings settings;
        private StringBuilder processStdError;
        private ManualResetEventSlim versionCheckComplete;
        private bool runtimeCanExit = false;

        private readonly JSProcess jsProcess;
        private readonly JsonDataSerializer dataSerializer;
        private readonly TestRunEvents testRunEvents;

        protected int ErrorLength { get; set; } = 4096;

        public TestRuntimeManager(JsonDataSerializer dataSerializer, IProcessHelper processHelper, JSProcess process)
        {
            this.dataSerializer = dataSerializer;
            this.jsProcess = process;
            this.versionCheckComplete = new ManualResetEventSlim();
        }

        public TestRuntimeManager(JSTestSettings settings, TestRunEvents testRunEvents)
            : this(JsonDataSerializer.Instance, new ProcessHelper(), new JSProcess())
        {
            this.settings = settings;
            this.testRunEvents = testRunEvents;

            this.jsProcess.EnableDebugLogs = this.settings.DebugLogs;
        }

        private Action<object> ProcessExitReceived => (process) =>
        {
            //this.jsProcess.WaitForExit();

            //this.testRunEvents.InvokeTestSessionEnd(this);

            // It's possible error occured before version check complete
            //versionCheckComplete.Set();
            if (!runtimeCanExit)
            {
                this.testRunEvents.InvokeTestSessionEnd(this);
                throw new JSTestException("JavaScript runtime quit unexpectedly.");
            }
        };

        private Action<object, string> ProcessOutputReceived => (process, data) =>
        {
            Console.Write(data);
        };

        private Action<object, string> ProcessErrorReceived => (process, data) =>
        {
            this.errorReceivedCallback(this.processStdError, data);

            var errorString = this.processStdError.ToString();
            if (!string.IsNullOrEmpty(errorString))
            {
                //messageLogger.SendMessage(TestMessageLevel.Error, errorString);
                Console.Write(errorString);
                // clear waits
            }
        };

        public void errorReceivedCallback(StringBuilder testRunnerProcessStdError, string data)
        {
            if (!string.IsNullOrEmpty(data))
            {
                testRunnerProcessStdError.Clear();

                // Log all standard error message because on too much data we ignore starting part.
                // This is helpful in abnormal failure of testhost.
                EqtTrace.Warning("Test host standard error line: {0}", data);

                // Add newline for readbility.
                data += Environment.NewLine;

                // if incoming data stream is huge empty entire testError stream, & limit data stream to MaxCapacity
                if (data.Length > testRunnerProcessStdError.MaxCapacity)
                {
                    testRunnerProcessStdError.Clear();
                    data = data.Substring(data.Length - testRunnerProcessStdError.MaxCapacity);
                }

                // remove only what is required, from beginning of error stream
                else
                {
                    int required = data.Length + testRunnerProcessStdError.Length - testRunnerProcessStdError.MaxCapacity;
                    if (required > 0)
                    {
                        testRunnerProcessStdError.Remove(0, required);
                    }
                }

                testRunnerProcessStdError.Append(data);
            }
        }

        public Task CleanProcessAsync()
        {
            try
            {
                this.jsProcess.TerminateProcess();
            }
            catch (Exception ex)
            {
                EqtTrace.Warning("JSTestHostManager: Unable to terminate test host process: " + ex);
            }

            return Task.FromResult(true);
        }

        public async Task<bool> LaunchProcessAsync(TestProcessStartInfo runtimeProcessStartInfo, CancellationToken cancellationToken)
        {
            return await Task.Run(() =>
            {
                try
                {
                    this.processStdError = new StringBuilder(this.ErrorLength, this.ErrorLength);
                    EqtTrace.Verbose("JSTestHostManager: Starting process '{0}' with command line '{1}'", runtimeProcessStartInfo.FileName, runtimeProcessStartInfo.Arguments);

                    cancellationToken.ThrowIfCancellationRequested();

                    this.jsProcess.LaunchProcess(runtimeProcessStartInfo, this.ProcessErrorReceived, this.ProcessExitReceived);

                }
                catch (OperationCanceledException ex)
                {
                    EqtTrace.Error("DotnetTestHostManager.LaunchHost: Failed to launch testhost: {0}", ex);
                    Console.Write(ex);
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
                // Start the message loop
                Task.Run(() => { this.MessageLoopAsync(this.jsProcess.CommunicationChannel, cancellationToken); });
                this.jsProcess.CommunicationChannel.SendMessage(MessageType.TestRunSettings, settings);

                this.versionCheckComplete.Wait();
            }
        }

        private Task MessageLoopAsync(CommunicationChannel channel, CancellationToken cancellationToken)
        {
            Exception error = null;

            // Set read timeout to avoid blocking receive raw message
            while (channel != null && !cancellationToken.IsCancellationRequested && this.jsProcess.IsAlive)
            {
                try
                {
                    var task = channel.ReceiveMessageAsync(cancellationToken);
                    task.Wait();

                    this.onMessageReceived(task.Result);
                }
                catch (Exception exception)
                {
                    EqtTrace.Error(
                            "Socket: Message loop: failed to receive message {0}",
                            exception);
                    error = exception;
                    break;
                }
            }

            return Task.FromResult(0);
        }

        private void onMessageReceived(Message message)
        {
            switch(message.MessageType)
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
                    this.testRunEvents.InvokeTestSessionEnd(this);
                    runtimeCanExit = true;
                    break;

                case MessageType.TestMessage:
                    var messagePayload = this.dataSerializer.DeserializePayload<TestMessagePayload>(message);
                    this.testRunEvents.InvokeMessageReceived(this, messagePayload);
                    break;

                case MessageType.ConsoleMessage:
                    var consolePayload = this.dataSerializer.DeserializePayload<TestMessagePayload>(message);
                    this.testRunEvents.InvokeMessageReceived(this, consolePayload);
                    break;

                default:
                    Console.Write(message.Payload);
                    break;
            }

        }
    }
}
