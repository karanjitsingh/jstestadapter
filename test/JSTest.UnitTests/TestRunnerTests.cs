using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace JSTest.UnitTests
{
    [TestClass]
    class TestRunnerTests
    {
        [TestMethod]
        public void TestRunnerWillUpdateSettingsForEnvOverrides()
        {
            Environment.SetEnvironmentVariable("JSTEST_RUNNER_DIAG", @"D:\");
            Environment.SetEnvironmentVariable("JSTEST_RUNNER_DIAG", "");
        }
    }
}
