using JSTest.Communication;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Text;

namespace JSTest.JSRuntime
{
    internal class JSProcess
    {
        private BinaryWriter binaryWriter;
        private BinaryReader binaryReader;
        private Process process;

        private event EventHandler<EventArgs> onMessageReceived;

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

        public bool LaunchProcess(ProcessStartInfo startInfo, Action<object, string> processErrorReceived,  Action<object> processExitReceived)
        {
            var process = new Process();
            try
            {
                process.StartInfo = startInfo;
                process.StartInfo.UseShellExecute = false;
                process.StartInfo.CreateNoWindow = true;

                process.StartInfo.RedirectStandardInput = true;
                process.StartInfo.RedirectStandardOutput = true;
                process.StartInfo.RedirectStandardError = true;

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
            this.InitializeStreams();

            return process != null;
        }

        public void SendMessage(string message)
        {
            if (this.IsAlive)
            {
                this.binaryWriter.Write(message);
            }
        }

        public void TerminateProcess()
        {
            if (this.IsAlive)
            {
                this.process.Kill();
            }
        }

        private void InitializeStreams()
        {
            if (this.IsAlive)
            {
                this.binaryWriter = new BinaryWriter(process.StandardInput.BaseStream);
                this.binaryReader = new BinaryReader(process.StandardOutput.BaseStream);
            }
        }
    }
}
