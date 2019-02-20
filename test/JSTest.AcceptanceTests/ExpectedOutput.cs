
using System.Collections.Generic;

namespace JSTest.AcceptanceTests
{
    public class ExpectedOutput
    {
        public ExpectedOutput(List<string> DiscoveryOutput, List<string> ExecutionOutput, List<string> ExecutionWithTestsOutput, List<string> ExecutionWithAttachmentsOutput)
        {
            this.DiscoveryOutput = DiscoveryOutput;
            this.ExecutionOutput = ExecutionOutput;
            this.ExecutionWithTestsOutput = ExecutionWithTestsOutput;
            this.ExecutionWithAttachmentsOutput = ExecutionWithAttachmentsOutput;
        }

        public List<string> DiscoveryOutput;
        public List<string> ExecutionOutput;
        public List<string> ExecutionWithTestsOutput;
        public List<string> ExecutionWithAttachmentsOutput;
    }
}