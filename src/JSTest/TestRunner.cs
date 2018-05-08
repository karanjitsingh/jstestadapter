using JSTest.Settings;
using JSTest.RuntimeProviders;
using System.Collections.Generic;
using System.Diagnostics;
using System.Text;
using System.Threading;

namespace JSTest
{
    public class TestRunner
    {
        public TestRunEvents TestRunEvents { private set; get; }

        public TestRunner()
        {
            this.TestRunEvents = new TestRunEvents();
        }

        public void StartExecution(IEnumerable<string> sources, JSTestSettings settings) {

            var runtimeProvider = RuntimeProviderFactory.GetRuntime(settings.Runtime);
            runtimeProvider.Initialize(settings);

            runtimeProvider.LaunchTestHostAsync(runtimeProvider.GetRuntimeProcessInfo())


        }

        private void StartRuntimeProcess(ProcessStartInfo startInfo, JSTestSettings settings)
        {
            var p = new Process();

            p.StartInfo = startInfo;

            p.StartInfo.UseShellExecute = false;
            p.StartInfo.CreateNoWindow = true;

            p.StartInfo.RedirectStandardOutput = true;
            p.StartInfo.StandardOutputEncoding = Encoding.UTF8;

            p.StartInfo.RedirectStandardError = true;
            p.StartInfo.StandardErrorEncoding = Encoding.UTF8;

            p.Start();
        }

    }

    public bool SetupChannel(IEnumerable<string> sources, CancellationToken cancellationToken)
    {
        var connTimeout = Constants.ClientConnectionTimeout;

        var userSpecifiedTimeout = Environment.GetEnvironmentVariable("VSTEST_CONNECTION_TIMEOUT");
        if (!string.IsNullOrEmpty(userSpecifiedTimeout) && Int32.TryParse(userSpecifiedTimeout, out int result))
        {
            connTimeout = result * 1000;
        }

        if (!this.initialized)
        {
            this.testHostProcessStdError = string.Empty;
            TestHostConnectionInfo testHostConnectionInfo = this.testHostManager.GetTestHostConnectionInfo();
            var portNumber = 0;

            if (testHostConnectionInfo.Role == ConnectionRole.Client)
            {
                portNumber = this.RequestSender.InitializeCommunication();
                testHostConnectionInfo.Endpoint += portNumber;
            }

            var processId = this.processHelper.GetCurrentProcessId();

            var connectionInfo = new TestRunnerConnectionInfo { Port = portNumber, ConnectionInfo = testHostConnectionInfo, RunnerProcessId = processId, LogFile = this.GetTimestampedLogFile(EqtTrace.LogFile) };

            // Subscribe to TestHost Event
            this.testHostManager.HostLaunched += this.TestHostManagerHostLaunched;
            this.testHostManager.HostExited += this.TestHostManagerHostExited;

            // Get the test process start info
            var testHostStartInfo = this.UpdateTestProcessStartInfo(this.testHostManager.GetTestHostProcessStartInfo(sources, null, connectionInfo));
            try
            {
                // Launch the test host.
                var hostLaunchedTask = this.testHostManager.LaunchTestHostAsync(testHostStartInfo, cancellationToken);
                this.testHostLaunched = hostLaunchedTask.Result;

                if (this.testHostLaunched && testHostConnectionInfo.Role == ConnectionRole.Host)
                {
                    // If test runtime is service host, try to poll for connection as client
                    this.RequestSender.InitializeCommunication();
                }
            }
            catch (Exception ex)
            {
                EqtTrace.Error("ProxyOperationManager: Failed to launch testhost :{0}", ex);
                throw new TestPlatformException(string.Format(CultureInfo.CurrentUICulture, CrossPlatEngineResources.FailedToLaunchTestHost, ex.ToString()));
            }

            // Warn the user that execution will wait for debugger attach.
            var hostDebugEnabled = Environment.GetEnvironmentVariable("VSTEST_HOST_DEBUG");
            if (!string.IsNullOrEmpty(hostDebugEnabled) && hostDebugEnabled.Equals("1", StringComparison.Ordinal))
            {
                ConsoleOutput.Instance.WriteLine(CrossPlatEngineResources.HostDebuggerWarning, OutputLevel.Warning);
                ConsoleOutput.Instance.WriteLine(
                    string.Format("Process Id: {0}, Name: {1}", this.testHostProcessId, this.processHelper.GetProcessName(this.testHostProcessId)),
                    OutputLevel.Information);

                // Increase connection timeout when debugging is enabled.
                connTimeout = 5 * this.connectionTimeout;
            }

            // Wait for a timeout for the client to connect.
            if (!this.testHostLaunched || !this.RequestSender.WaitForRequestHandlerConnection(connTimeout))
            {
                var errorMsg = CrossPlatEngineResources.InitializationFailed;

                if (!string.IsNullOrWhiteSpace(this.testHostProcessStdError))
                {
                    // Testhost failed with error
                    errorMsg = string.Format(CrossPlatEngineResources.TestHostExitedWithError, this.testHostProcessStdError);
                }

                throw new TestPlatformException(string.Format(CultureInfo.CurrentUICulture, errorMsg));
            }

            // Handling special case for dotnet core projects with older test hosts
            // Older test hosts are not aware of protocol version check
            // Hence we should not be sending VersionCheck message to these test hosts
            this.CompatIssueWithVersionCheckAndRunsettings();

            if (this.versionCheckRequired)
            {
                this.RequestSender.CheckVersionWithTestHost();
            }

            this.initialized = true;
        }

        return true;
    }
}
