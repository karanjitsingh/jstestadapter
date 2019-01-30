namespace JSTest.UnitTests.RuntimeProviders
{
    using JSTest.RuntimeProviders;
    using JSTest.Settings;
    using Microsoft.VisualStudio.TestTools.UnitTesting;
    using System.Collections.Generic;

    [TestClass]
    public class RuntimeProviderFactoryTests
    {
        RuntimeProcessInfoProvider factory;

        public RuntimeProviderFactoryTests()
        {
            factory = RuntimeProcessInfoProvider.Instance;
        }

        [TestMethod]
        public void IsRuntimeHostDebuggingWillReturnRightValue()
        {
            System.Environment.SetEnvironmentVariable("JSTEST_RUNNER_DEBUG", "true");
            Assert.AreEqual(factory.IsRuntimeDebuggingEnabled, false);
            System.Environment.SetEnvironmentVariable("JSTEST_RUNNER_DEBUG", "0");
            Assert.AreEqual(factory.IsRuntimeDebuggingEnabled, false);
            System.Environment.SetEnvironmentVariable("JSTEST_RUNNER_DEBUG", "1");
            Assert.AreEqual(factory.IsRuntimeDebuggingEnabled, true);
        }

        [TestMethod]
        public void GetRuntimeProcessInfoWillReturnRightProcess()
        {
            var settings = new JSTestSettings();
            settings.Runtime = JavaScriptRuntime.NodeJS;

            var sources = new string[] { "source" };

            var startInfo = factory.GetRuntimeProcessInfo(settings, sources);
            Assert.IsTrue(startInfo.FileName.EndsWith("node") || startInfo.FileName.EndsWith("node.exe"));
        }
    }
}
