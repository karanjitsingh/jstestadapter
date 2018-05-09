using System;
using System.Collections.Generic;
using System.Diagnostics;

using Microsoft.VisualStudio.TestPlatform.ObjectModel;
using Microsoft.VisualStudio.TestPlatform.ObjectModel.Adapter;
using Microsoft.VisualStudio.TestPlatform.ObjectModel.Logging;

using JSTest;
using JSTest.Settings;

namespace JSTest.TestAdapter
{
    [FileExtension(Constants.Extensions.JavaScript)]
    [DefaultExecutorUri(Constants.ExecutorUri)]
    public class TestDiscoverer : ITestDiscoverer
    {
        private readonly TestRunner testRunner;
        private ITestCaseDiscoverySink discoverySink;
        private IMessageLogger messageLogger;

        public TestDiscoverer()
        {
            this.testRunner = new TestRunner();
        }

        public void DiscoverTests(IEnumerable<string> sources, IDiscoveryContext discoveryContext, IMessageLogger logger, ITestCaseDiscoverySink discoverySink)
        {
            this.discoverySink = discoverySink;
            this.messageLogger = logger;

            this.testRunner.TestRunEvents.onTestCaseFound += this.onTestCaseFoundHandler;

            //TestRunner.DiscoverTests
            var settings = new JSTestSettings();
            this.testRunner.DiscoverTests(sources, settings);
        }

        private void onTestCaseFoundHandler(object sender, TestCaseFoundEventArgs e)
        {
            this.discoverySink.SendTestCase(e.TestCase);
        }
    }
}