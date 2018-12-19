using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace JSTest.AcceptanceTests
{
    public class ExecutionOutput
    {
        private StreamReader stdOut;
        private StreamReader stdErr;
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
                return stdOut.ReadToEnd();
            }
        }

        public string StdErr {
            get
            {
                return stdErr.ReadToEnd();
            }
        }

        public ExecutionOutput(Process process)
        {
            process.Start();

            this.stdOut = process.StandardOutput;
            this.stdErr = process.StandardError;


            this.waitTimeout = !process.WaitForExit(1200000);
        }
    }
}
