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
        public StreamReader StdOut { get; private set; }
        public StreamReader StdErr { get; private set; }

        public ExecutionOutput(Process process)
        {
            this.StdOut = process.StandardOutput;
            this.StdErr = process.StandardError;
        }
    }
}
