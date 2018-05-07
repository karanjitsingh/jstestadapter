// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

namespace JSTest.RuntimeProviders
{
    using System;
    using System.IO;
    using System.Reflection;

    using Microsoft.VisualStudio.TestPlatform.ObjectModel;
    using Microsoft.VisualStudio.TestPlatform.ObjectModel.Host;
    using Microsoft.VisualStudio.TestPlatform.ObjectModel.Logging;
    using Microsoft.VisualStudio.TestPlatform.PlatformAbstractions;
    using Microsoft.VisualStudio.TestPlatform.PlatformAbstractions.Interfaces;

    using JSTest.Settings;
    using System.Threading.Tasks;
    using System.Threading;
    using System.Text;
    using System.Diagnostics;

    class NodeRuntimeProvider : IRuntimeProvider
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

        public NodeRuntimeProvider()
            : this(new PlatformEnvironment(), new ProcessHelper())
        {

        }


        public NodeRuntimeProvider(IEnvironment environment, IProcessHelper processHelper)
        {
            this.environment = environment;
            this.processHelper = processHelper;
        }


        public void Initialize(JSTestSettings settings)
        {
            this.settings = settings;
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


        public ProcessStartInfo GetRuntimeProcessInfo()
        {
            var processInfo = new ProcessStartInfo();
            string rootFolder = Path.GetDirectoryName(typeof(TestRunner).GetTypeInfo().Assembly.GetAssemblyLocation());

            processInfo.FileName = this.getNodeBinaryPath(rootFolder);

            var jstesthost = Path.Combine(rootFolder, "JSTestHost", "index.js");

            var hostDebugEnabled = Environment.GetEnvironmentVariable("JSTEST_HOST_DEBUG");
            var debug = !string.IsNullOrEmpty(hostDebugEnabled) && hostDebugEnabled.Equals("1", StringComparison.Ordinal);

            processInfo.EnvironmentVariables.Add("NODE_PATH", Environment.GetEnvironmentVariable("NODE_PATH") + ";" + Path.Combine(rootFolder, "JSTestHost", "node_modules"));

            processInfo.EnvironmentVariables.Add("NODE_NO_WARNINGS", "1");
            //processInfo.EnvironmentVariables.Add("NODE_DEBUG", "module");

            processInfo.Arguments = string.Format(
                " -r source-map-support/register {0} {1} {2}",
                debug ? "--inspect-brk=9229" : "",
                jstesthost,
                $"--framework {this.settings.TestFramework}");

            return processInfo;
        }

        private string getNodeBinaryPath(string rootFolder)
        {
            string platform = string.Empty;
            string architecture = string.Empty;
            string executable = string.Empty;


            if (this.environment.Architecture == PlatformArchitecture.X64)
            {
                architecture = "x64";
            }
            else if (this.environment.Architecture == PlatformArchitecture.X86)
            {
                architecture = "x86";
            }

            if (this.environment.OperatingSystem == PlatformOperatingSystem.Windows)
            {
                platform = "win";
                executable = "node.exe";
            }
            else if (this.environment.OperatingSystem == PlatformOperatingSystem.Unix)
            {
                platform = "linux";
                executable = "node";
            }

            Debug.Assert(!string.IsNullOrEmpty(platform));
            Debug.Assert(!string.IsNullOrEmpty(architecture));
            Debug.Assert(!string.IsNullOrEmpty(executable));

            return String.Format(Path.Combine(rootFolder, "node", $"{platform}-{architecture}", executable));
        }

    }
}

