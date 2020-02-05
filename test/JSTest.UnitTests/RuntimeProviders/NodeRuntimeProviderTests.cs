namespace JSTest.UnitTests.RuntimeProviders
{
    using JSTest.RuntimeProviders;
    using Microsoft.VisualStudio.TestTools.UnitTesting;
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Reflection;
    using System.Text.RegularExpressions;

    [TestClass]
    public class NodeRuntimeProviderTests
    {
        NodeRuntimeProvider runtimeProvider;

        public NodeRuntimeProviderTests()
        {
            this.runtimeProvider = NodeRuntimeProvider.Instance;
        }

        [TestMethod]
        public void GetRuntimeProcessInfoWillReturnProcessInfoWithCorrectProperties()
        {
            var sources = new string[] { "source1", "source2", "source3" };
            var startInfo = this.runtimeProvider.GetRuntimeProcessInfo(null, null, false, sources);
            var arguments = Regex.Match(startInfo.Arguments, " -r source-map-support/register (.*)");

            Assert.IsTrue(arguments.Groups[1].Value.EndsWith("index.js"));
            Assert.IsTrue(startInfo.FileName.EndsWith("node") || startInfo.FileName.EndsWith("node.exe"));

            // Write path wrapper for testable methods
        }
    }
}
