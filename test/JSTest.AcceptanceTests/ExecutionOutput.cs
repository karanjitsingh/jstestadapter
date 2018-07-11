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
        private string stdOutString = null;
        private string stdErrString = null;

        public string StdOut
        {
            get
            {
                if(stdOutString == null)
                {
                    stdOutString = stdOut.ReadToEnd();
                    Console.Write(stdOutString);
                }
                return stdOutString;
            }
        }

        public string StdErr {
            get
            {
                if (stdErrString == null)
                {
                    stdErrString = stdErr.ReadToEnd();
                    Console.Error.Write(stdErrString);
                }
                return stdErrString;
            }
        }

        public ExecutionOutput(Process process)
        {
            this.stdOut = process.StandardOutput;
            this.stdErr = process.StandardError;
        }
    }
}
