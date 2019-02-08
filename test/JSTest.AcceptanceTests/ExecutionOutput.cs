using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace JSTest.AcceptanceTests
{
    public class ExecutionOutput
    {
        private StringBuilder output = new StringBuilder();
        private StringBuilder error = new StringBuilder();

        private bool waitTimeout = false;

        public bool ProcessTimeout
        {
            get
            {
                return waitTimeout;
            }
        }

        public string StdOut
        {
            get
            {
                return output.ToString();
            }
        }

        public string StdErr
        {
            get
            {
                return error.ToString();
            }
        }

        public ExecutionOutput(Process process)
        {
            var timeout = 1200000;

            using (AutoResetEvent outputWaitHandle = new AutoResetEvent(false))
            using (AutoResetEvent errorWaitHandle = new AutoResetEvent(false))
            {

                /* There is a limit to the stream buffer if this limit is reached, console.write infinitely waits
                 * Hence, save the output in a buffer instead of reading all of it using .ReadToEnd()
                 */

                process.OutputDataReceived += (sender, e) => {
                    if (e.Data == null)
                    {
                        outputWaitHandle.Set();
                    }
                    else
                    {
                        output.AppendLine(e.Data);
                    }
                };
                process.ErrorDataReceived += (sender, e) =>
                {
                    if (e.Data == null)
                    {
                        errorWaitHandle.Set();
                    }
                    else
                    {
                        error.AppendLine(e.Data);
                    }
                };

                process.Start();

                process.BeginOutputReadLine();
                process.BeginErrorReadLine();

                if (process.WaitForExit(timeout) &&
                    outputWaitHandle.WaitOne(timeout) &&
                    errorWaitHandle.WaitOne(timeout))
                {
                    // Process completed. Check process.ExitCode here.
                }
                else
                {
                    this.waitTimeout = true;
                }
            }
        }
    }
}
