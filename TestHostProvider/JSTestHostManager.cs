// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

namespace Microsoft.VisualStudio.JSTestHostRuntimeProvider
{
    using System;
    using System.Collections.Generic;
    using System.Diagnostics;
    using System.Globalization;
    using System.IO;
    using System.Linq;
    using System.Text;
    using System.Threading;
    using System.Threading.Tasks;

    using Microsoft.VisualStudio.TestPlatform.CoreUtilities.Extensions;
    using Microsoft.VisualStudio.TestPlatform.ObjectModel;
    using Microsoft.VisualStudio.TestPlatform.ObjectModel.Client.Interfaces;
    using Microsoft.VisualStudio.TestPlatform.ObjectModel.Host;
    using Microsoft.VisualStudio.TestPlatform.ObjectModel.Logging;
    using Microsoft.VisualStudio.TestPlatform.ObjectModel.Utilities;
    using Microsoft.VisualStudio.TestPlatform.Utilities.Helpers;
    using Microsoft.VisualStudio.TestPlatform.Utilities.Helpers.Interfaces;

    using Microsoft.VisualStudio.TestPlatform.PlatformAbstractions;
    using Microsoft.VisualStudio.TestPlatform.PlatformAbstractions.Interfaces;
    using System.Reflection;

    [ExtensionUri(JavaScriptTestHostUri)]
    [FriendlyName(JavaScriptTestHostFriendlyName)]
    public class JSTestHostManager : ITestRuntimeProvider
    {
        private const string JavaScriptTestHostUri = "HostProvider://JavaScriptTestHost";
        private const string JavaScriptTestHostFriendlyName = "JavaScriptTestHost";
        private const string TestAdapterRegexPattern = @"TestAdapter.dll";

        private IFileHelper fileHelper;
        private IProcessHelper processHelper;
        private IEnvironment environment;
        private Process testHostProcess;
        private ITestHostLauncher testHostLauncher;
        private StringBuilder testHostProcessStdError;
        private IMessageLogger messageLogger;
        private bool hostExitedEventRaised;
        private string hostPackageVersion = "15.0.0";

        protected int ErrorLength { get; set; } = 4096;

        private Action<object> ExitCallBack => (process) =>
        {
            //TestHostManagerCallbacks.ExitCallBack(this.processHelper, process, this.testHostProcessStdError, this.OnHostExited);
        };

        private Action<object, string> ErrorReceivedCallback => (process, data) =>
        {
            //TestHostManagerCallbacks.ErrorReceivedCallback(this.testHostProcessStdError, data);
        };

        /// <summary>
        /// Initializes a new instance of the <see cref="DotnetTestHostManager"/> class.
        /// </summary>
        public JSTestHostManager()
            : this(new FileHelper(), new ProcessHelper(), new PlatformEnvironment())
        {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="DotnetTestHostManager"/> class.
        /// </summary>
        /// <param name="processHelper">Process helper instance.</param>
        /// <param name="fileHelper">File helper instance.</param>
        /// <param name="dotnetHostHelper">DotnetHostHelper helper instance.</param>
        internal JSTestHostManager(IFileHelper fileHelper, IProcessHelper processHelper, IEnvironment environment)
        {
            this.fileHelper = fileHelper;
            this.processHelper = processHelper;
            this.environment = environment;
            if(Environment.GetEnvironmentVariable("JSTHOST_DEBUG") == "1")
            {
                Debugger.Launch();
            }
        }

        /// <inheritdoc />
        public event EventHandler<HostProviderEventArgs> HostLaunched;

        /// <inheritdoc />
        public event EventHandler<HostProviderEventArgs> HostExited;

        /// <summary>
        /// Gets a value indicating whether gets a value indicating if the test host can be shared for multiple sources.
        /// </summary>
        /// <remarks>
        /// Dependency resolution for .net core projects are pivoted by the test project. Hence each test
        /// project must be launched in a separate test host process.
        /// </remarks>
        public bool Shared => true;

        /// <inheritdoc/>
        public void Initialize(IMessageLogger logger, string runsettingsXml)
        {
            this.messageLogger = logger;
            this.hostExitedEventRaised = false;
        }

        /// <inheritdoc/>
        public void SetCustomLauncher(ITestHostLauncher customLauncher)
        {
            this.testHostLauncher = customLauncher;
        }

        /// <inheritdoc/>
        public TestHostConnectionInfo GetTestHostConnectionInfo()
        {
            return new TestHostConnectionInfo { Endpoint = "127.0.0.1:", Role = ConnectionRole.Client, Transport = Transport.Sockets };
        }

        /// <inheritdoc/>
        public async Task<bool> LaunchTestHostAsync(TestProcessStartInfo testHostStartInfo, CancellationToken cancellationToken)
        {
            return await Task.Run(() =>
            {
                try
                {
                    this.testHostProcessStdError = new StringBuilder(this.ErrorLength, this.ErrorLength);
                    if (this.testHostLauncher == null)
                    {
                        EqtTrace.Verbose("DotnetTestHostManager: Starting process '{0}' with command line '{1}'", testHostStartInfo.FileName, testHostStartInfo.Arguments);

                        cancellationToken.ThrowIfCancellationRequested();
                        this.testHostProcess = this.processHelper.LaunchProcess(testHostStartInfo.FileName, testHostStartInfo.Arguments, testHostStartInfo.WorkingDirectory, testHostStartInfo.EnvironmentVariables, this.ErrorReceivedCallback, this.ExitCallBack) as Process;
                    }
                    else
                    {
                        var processId = this.testHostLauncher.LaunchTestHost(testHostStartInfo);
                        this.testHostProcess = Process.GetProcessById(processId);
                        this.processHelper.SetExitCallback(processId, this.ExitCallBack);
                    }
                }
                catch (OperationCanceledException ex)
                {
                    EqtTrace.Error("DotnetTestHostManager.LaunchHost: Failed to launch testhost: {0}", ex);
                    this.messageLogger.SendMessage(TestMessageLevel.Error, ex.ToString());
                    return false;
                }

                //this.OnHostLaunched(new HostProviderEventArgs("Test Runtime launched", 0, this.testHostProcess.Id));

                return this.testHostProcess != null;
            });
            //return await Task.Run(() => this.LaunchHost(testHostStartInfo, cancellationToken), cancellationToken);
        }

        /// <inheritdoc/>
        public virtual TestProcessStartInfo GetTestHostProcessStartInfo(
            IEnumerable<string> sources,
            IDictionary<string, string> environmentVariables,
            TestRunnerConnectionInfo connectionInfo)
        {
            string rootFolder = Path.GetDirectoryName(typeof(JSTestHostManager).GetTypeInfo().Assembly.GetAssemblyLocation());

            string nodeExecutable = string.Empty;
            string archSuffix = string.Empty;

            if (this.environment.Architecture == PlatformArchitecture.X64)
            {
                archSuffix = "-x64";
            }
            else if(this.environment.Architecture == PlatformArchitecture.X86)
            {
                archSuffix = "-x86";
            }

            if(this.environment.OperatingSystem == PlatformOperatingSystem.Windows)
            {
                nodeExecutable = Path.Combine(rootFolder, "node", "win" + archSuffix, "node.exe");
            }
            else if(this.environment.OperatingSystem == PlatformOperatingSystem.Unix)
            {
                nodeExecutable = Path.Combine(rootFolder, "node", "linux" + archSuffix, "node");
            }

            var processInfo = new TestProcessStartInfo();

            processInfo.FileName = nodeExecutable;

            var jstesthost = Path.Combine(rootFolder, "jstesthost", "index.js");

            processInfo.Arguments = string.Format(
                "--inspect-brk=9229 {0} {1} {2}",
                jstesthost,
                connectionInfo.Port,
                connectionInfo.ConnectionInfo.Endpoint);

            return processInfo;
        }

        /// <inheritdoc/>
        public IEnumerable<string> GetTestPlatformExtensions(IEnumerable<string> sources, IEnumerable<string> extensions)
        {
            return Enumerable.Empty<string>();
        }

        /// <inheritdoc/>
        public IEnumerable<string> GetTestSources(IEnumerable<string> sources)
        {
            // We do not have scenario where netcore tests are deployed to remote machine, so no need to udpate sources
            return sources;
        }

        /// <inheritdoc/>
        public bool CanExecuteCurrentRunConfiguration(string runsettingsXml)
        {
            var config = XmlRunSettingsUtilities.GetRunConfigurationNode(runsettingsXml);
            var framework = config.TargetFramework;

            if (framework.Name.IndexOf("javascript", StringComparison.OrdinalIgnoreCase) >= 0)
            {
                return true;
            }

            return false;
        }

        /// <inheritdoc/>
        public Task CleanTestHostAsync(CancellationToken cancellationToken)
        {
            //try
            //{
            //    this.processHelper.TerminateProcess(this.testHostProcess);
            //}
            //catch (Exception ex)
            //{
            //    EqtTrace.Warning("DotnetTestHostManager: Unable to terminate test host process: " + ex);
            //}

            //this.testHostProcess?.Dispose();

            //return Task.FromResult(true);
            return Task.Run(() => { });
        }
    }
}
