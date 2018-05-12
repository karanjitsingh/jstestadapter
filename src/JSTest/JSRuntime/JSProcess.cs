using JSTest.Communication;
using Microsoft.VisualStudio.TestPlatform.ObjectModel;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Text;

namespace JSTest.JSRuntime
{
    internal class JSProcess
    {
        private Process process;
        private CommunicationChannel channel;

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

        public JSProcess()
        {
        }
      
        public bool IsAlive
        {
            get
            {
                return this.process != null && !this.process.HasExited;
            }
        }

        public void WaitForExit()
        {
            this.process.WaitForExit(3000);
        }

        public bool LaunchProcess(TestProcessStartInfo startInfo, Action<object, string> processErrorReceived, Action<object> processExitReceived)
        {
            var process = new Process();
            try
            {
                this.InitializeStartInfo(process, startInfo);

                process.EnableRaisingEvents = true;
                process.ErrorDataReceived += (sender, args) => processErrorReceived(sender as Process, args.Data);
                process.Exited += (sender, args) =>
                {
                    // Call WaitForExit without again to ensure all streams are flushed,
                    var p = sender as Process;
                    try
                    {
                        // Add timeout to avoid indefinite waiting on child process exit.
                        p.WaitForExit(500);
                    }
                    catch (InvalidOperationException)
                    {
                    }

                    // If exit callback has code that access Process object, ensure that the exceptions handling should be done properly.
                    processExitReceived(p);
                };

                // EqtTrace.Verbose("ProcessHelper: Starting process '{0}' with command line '{1}'", processPath, arguments);
                process.Start();
                process.BeginErrorReadLine();
            }
            catch (Exception)
            {
                process.Dispose();
                process = null;

                // EqtTrace.Error("TestHost Object {0} failed to launch with the following exception: {1}", processPath, exception.Message);
                throw;
            }

            this.process = process;
            this.InitializeChannel();

            return process != null;
        }
        
        public void TerminateProcess()
        {
            if (this.IsAlive)
            {
                this.process.Kill();
            }
        }

        private void InitializeStartInfo(Process process, TestProcessStartInfo startInfo)
        {
            process.StartInfo.FileName = startInfo.FileName;
            process.StartInfo.WorkingDirectory = startInfo.WorkingDirectory;
            process.StartInfo.Arguments = startInfo.Arguments;

            foreach(var entry in startInfo.EnvironmentVariables)
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

        private void InitializeChannel()
        {
            this.channel = new CommunicationChannel(this.process.StandardInput.BaseStream, this.process.StandardOutput.BaseStream);
        }
    }
}
