using JSTest.Settings;
using Microsoft.VisualStudio.TestPlatform.ObjectModel;
using Microsoft.VisualStudio.TestPlatform.ObjectModel.Host;
using Microsoft.VisualStudio.TestPlatform.ObjectModel.Logging;
using Microsoft.VisualStudio.TestPlatform.PlatformAbstractions.Interfaces;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace JSTest.RuntimeManager
{
    internal class RuntimeManager
    {
        private JSTestSettings settings;
        private IProcessHelper processHelper;
        private IEnvironment environment;
        private Process process;
        private StringBuilder processStdError;
        private IMessageLogger messageLogger;

        protected int ErrorLength { get; set; } = 4096;

        public event EventHandler<HostProviderEventArgs> HostLaunched;

        public event EventHandler<HostProviderEventArgs> HostExited;

        private Action<object> ExitCallBack => (process) =>
        {
            //TestHostManagerCallbacks.ExitCallBack(this.processHelper, process, this.testHostProcessStdError, this.OnHostExited);
        };

        private Action<object, string> ErrorReceivedCallback => (process, data) =>
        {
            this.errorReceivedCallback(this.processStdError, data);

            var errorString = this.processStdError.ToString();
            if (!string.IsNullOrEmpty(errorString))
            {
                messageLogger.SendMessage(TestMessageLevel.Error, errorString);
            }
        };

        public void errorReceivedCallback(StringBuilder testHostProcessStdError, string data)
        {
            if (!string.IsNullOrEmpty(data))
            {
                testHostProcessStdError.Clear();

                // Log all standard error message because on too much data we ignore starting part.
                // This is helpful in abnormal failure of testhost.
                EqtTrace.Warning("Test host standard error line: {0}", data);

                // Add newline for readbility.
                data += Environment.NewLine;

                // if incoming data stream is huge empty entire testError stream, & limit data stream to MaxCapacity
                if (data.Length > testHostProcessStdError.MaxCapacity)
                {
                    testHostProcessStdError.Clear();
                    data = data.Substring(data.Length - testHostProcessStdError.MaxCapacity);
                }

                // remove only what is required, from beginning of error stream
                else
                {
                    int required = data.Length + testHostProcessStdError.Length - testHostProcessStdError.MaxCapacity;
                    if (required > 0)
                    {
                        testHostProcessStdError.Remove(0, required);
                    }
                }

                testHostProcessStdError.Append(data);
            }
        }

        public Task CleanTestHostAsync(CancellationToken cancellationToken)
        {
            try
            {
                this.processHelper.TerminateProcess(this.process);
            }
            catch (Exception ex)
            {
                EqtTrace.Warning("JSTestHostManager: Unable to terminate test host process: " + ex);
            }

            this.process?.Dispose();

            return Task.FromResult(true);
        }

        public async Task<bool> LaunchTestHostAsync(TestProcessStartInfo testHostStartInfo, CancellationToken cancellationToken)
        {
            return await Task.Run(() =>
            {
                try
                {
                    this.processStdError = new StringBuilder(this.ErrorLength, this.ErrorLength);
                    EqtTrace.Verbose("DotnetTestHostManager: Starting process '{0}' with command line '{1}'", testHostStartInfo.FileName, testHostStartInfo.Arguments);

                    cancellationToken.ThrowIfCancellationRequested();
                    this.process = this.processHelper.LaunchProcess(testHostStartInfo.FileName, testHostStartInfo.Arguments, testHostStartInfo.WorkingDirectory, testHostStartInfo.EnvironmentVariables, this.ErrorReceivedCallback, this.ExitCallBack) as Process;
                }
                catch (OperationCanceledException ex)
                {
                    EqtTrace.Error("DotnetTestHostManager.LaunchHost: Failed to launch testhost: {0}", ex);
                    this.messageLogger.SendMessage(TestMessageLevel.Error, ex.ToString());
                    return false;
                }

                //this.OnHostLaunched(new HostProviderEventArgs("Test Runtime launched", 0, this.testHostProcess.Id));

                return this.process != null;
            });
            //return await Task.Run(() => this.LaunchHost(testHostStartInfo, cancellationToken), cancellationToken);
        }

        void SendMessage(Message message)
        {

        }
    }
}
