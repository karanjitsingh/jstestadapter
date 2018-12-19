using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Threading.Tasks;
using JSTest.Communication;
using JSTest.Interfaces;
using JSTest.RuntimeProviders;
using Microsoft.VisualStudio.TestPlatform.ObjectModel;

namespace JSTest
{
    internal class JSProcess
    {
        private Process process;
        private CommunicationChannel channel;
        private bool debugEnabled;
        private string debugFilePath;
        private int jsProcessId = 0;

        public CommunicationChannel CommunicationChannel
        {
            get
            {
                if (this.IsAlive)
                {
                    return this.channel;
                }
                else
                {
                    throw new Exception("Process is not running.");
                }
            }
        }

        public int ProcessId
        {
            get
            {
                return this.jsProcessId;
            }
            private set
            {
                this.jsProcessId = value;
            }
        }

        public JSProcess()
        {
        }

        public bool IsAlive => this.process != null && !this.process.HasExited;
        
        public string DebugFilePath { get; set; }

        public void EnableDebugLogs(string debugFilePath)
        {
            this.debugEnabled = true;
            this.debugFilePath = debugFilePath;
        }

        public bool LaunchProcess(TestProcessStartInfo startInfo, ProcessCallbacks processStreamCallbacks)
        {
            var endpoint = this.InitializeChannel();
            
            var process = new Process();
            try
            {
                this.InitializeStartInfo(process, startInfo, endpoint);

                process.EnableRaisingEvents = true;
                process.OutputDataReceived += (sender, args) => processStreamCallbacks.outputReceived(sender as Process, args.Data);
                process.ErrorDataReceived += (sender, args) => processStreamCallbacks.errorReceived(sender as Process, args.Data);
                process.Exited += (sender, args) =>
                {
                    // Call WaitForExit without again to ensure all streams are flushed,
                    var exitingProcess = sender as Process;
                    try
                    {
                        // Add timeout to avoid indefinite waiting on child process exit.
                        if (exitingProcess.WaitForExit(500))
                        {
                            EqtTrace.Verbose("JSProcess: Process with id {0} exited successfully.", jsProcessId);
                        }
                        else
                        {
                            EqtTrace.Error("JSProcess: WaitForExit timed out for process {0}", jsProcessId);
                        }
                    }
                    catch (InvalidOperationException)
                    {
                        // Process had already exited
                    }

                    // If exit callback has code that access Process object, ensure that the exceptions handling should be done properly.
                    processStreamCallbacks.exitReceived(exitingProcess);
                };

                EqtTrace.Verbose("JSProcess: Starting process '{0}' with command line '{1}'", startInfo.FileName, startInfo.Arguments);

                process.Start();
                process.BeginErrorReadLine();
                process.BeginOutputReadLine();
                this.jsProcessId = process.Id;
            }
            catch (Exception exception)
            {
                process.Dispose();
                process = null;

                EqtTrace.Error("JSProcess: Test runner {0} failed to launch with the following exception: {1}", startInfo.FileName, exception.Message);
                throw;
            }

            this.process = process;

            this.channel.WaitForClientConnection(GetConnectionTimeout());

            return process != null;
        }

        private int GetConnectionTimeout()
        {
            var connectionTimeoutString = Environment.GetEnvironmentVariable(Constants.VsTestConnectionTimeout);
            if (!int.TryParse(connectionTimeoutString, out int connectionTimeout))
            {
                connectionTimeout = Constants.DefaultVsTestNodeStartTimeout;
            }

            return RuntimeProviderFactory.Instance.IsRuntimeDebuggingEnabled
                                                ? Constants.VsTestNodeStartInfiniteTimout
                                                : connectionTimeout;
        }

        public void TerminateProcess()
        {
            if (this.IsAlive)
            {
                this.process.Kill();
                this.process.WaitForExit();
            }
        }

        private void InitializeStartInfo(Process process, TestProcessStartInfo startInfo, IPEndPoint endPoint)
        {
            process.StartInfo.FileName = startInfo.FileName;
            process.StartInfo.WorkingDirectory = startInfo.WorkingDirectory;
            process.StartInfo.Arguments = string.Format("{0} {1} {2} {3}",
                                                        startInfo.Arguments,
                                                        endPoint.Address,
                                                        endPoint.Port,
                                                        this.GetDebugArg());

            foreach (var entry in startInfo.EnvironmentVariables)
            {
#if NETSTANDARD14
                process.StartInfo.Environment.Add(entry);
#endif
#if NET451
                process.StartInfo.EnvironmentVariables.Add(entry.Key, entry.Value);
#endif
            }

            process.StartInfo.UseShellExecute = false;
            process.StartInfo.CreateNoWindow = true;

            process.StartInfo.RedirectStandardInput = true;
            process.StartInfo.RedirectStandardOutput = true;
            process.StartInfo.RedirectStandardError = true;
        }

        private IPEndPoint InitializeChannel()
        {
            this.channel = new CommunicationChannel();
            var endpoint = channel.HostServer(new IPEndPoint(IPAddress.Loopback, 0));
            Task.Run(() => channel.AcceptClientAsync());

            return endpoint;
        }

        private string GetDebugArg()
        {
            if (this.debugEnabled)
            {
                var arg = "--diag";

                try {
                    if (File.Exists(this.debugFilePath) || Directory.Exists(Path.GetDirectoryName(this.debugFilePath)) || Directory.Exists(this.debugFilePath))
                    {
                        arg += " " + Uri.EscapeDataString(this.debugFilePath);
                    }
                }
                catch
                {
                    EqtTrace.Warning("JSProcess: Could not use debug file path \"{0}\"", this.debugFilePath);
                }

                return arg;
            }

            return string.Empty;

        }
    }
}
