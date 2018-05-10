using System;
using System.Collections.Generic;
using System.Diagnostics;

using Microsoft.VisualStudio.TestPlatform.ObjectModel;
using Microsoft.VisualStudio.TestPlatform.ObjectModel.Adapter;
using Microsoft.VisualStudio.TestPlatform.ObjectModel.Logging;

using JSTest.Settings;
using JSTest.Communication.Payloads;
using System.Threading;

namespace JSTest.TestAdapter
{
    [FileExtension(Constants.FileExtensions.JavaScript)]
    [DefaultExecutorUri(Constants.ExecutorUri)]
    public class JavaScriptTestDiscoverer : ITestDiscoverer
    {
        private readonly TestRunner testRunner;
        private ITestCaseDiscoverySink discoverySink;
        private IMessageLogger messageLogger;
        private ManualResetEventSlim DiscoveryCompletion;

        public JavaScriptTestDiscoverer()
        {
            this.testRunner = new TestRunner();
            this.DiscoveryCompletion = new ManualResetEventSlim();
        }

        public void DiscoverTests(IEnumerable<string> sources, IDiscoveryContext discoveryContext, IMessageLogger logger, ITestCaseDiscoverySink discoverySink)
        {
            Debugger.Launch();
            this.discoverySink = discoverySink;
            this.messageLogger = logger;

            //TestRunner.DiscoverTests
            var settings = new JSTestSettings();
            settings.Discovery = true;

            var events =  this.testRunner.StartExecution(sources, settings);

            events.onTestCaseFound += onTestCaseFoundHandler;

            this.DiscoveryCompletion.Wait();
        }

        private void onTestCaseFoundHandler(object sender, TestCaseFoundEventArgs e)
        {
            this.discoverySink.SendTestCase(e.TestCase);
        }

        private void onTestSessionEndHandler(object sender)
        {
            this.DiscoveryCompletion.Set();
        }
    }
}