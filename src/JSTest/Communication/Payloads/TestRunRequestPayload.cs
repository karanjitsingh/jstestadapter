using Microsoft.VisualStudio.TestPlatform.ObjectModel;
using System;
using System.Collections.Generic;
using System.Text;

namespace JSTest.Communication.Payloads
{
	[Serializable]
    public class StartExecutionWithSourcesPayload
    {
        public TestRunSettings TestRunSettings;
        public IEnumerable<string> Sources;
    }

	[Serializable]
    public class StartExecutionWithTestsPayload
    {
        public TestRunSettings TestRunSettings;
        public IEnumerable<TestCase> Tests;
    }

    [Serializable]
    public class StartDiscoveryPayload
    {
        public TestRunSettings TestRunSettings;
        public IEnumerable<string> Sources;
    }
}
