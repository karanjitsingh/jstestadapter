using System;
using System.Collections.Generic;
using System.Diagnostics;

using Microsoft.VisualStudio.TestPlatform.ObjectModel;
using Microsoft.VisualStudio.TestPlatform.ObjectModel.Adapter;
using Microsoft.VisualStudio.TestPlatform.ObjectModel.Logging;

using JSTest.Settings;
using JSTest.Communication.Payloads;
using System.Threading;
using JSTest.Interfaces;

namespace JSTest.TestAdapter
{
    [FileExtension(AdapterConstants.FileExtensions.JSON)]
    [FileExtension(AdapterConstants.FileExtensions.JavaScript)]
    [DefaultExecutorUri(AdapterConstants.ExecutorUri)]
    public class JavaScriptTestDiscoverer : ITestDiscoverer
    {
        private readonly TestRunner testRunner;
        private ITestCaseDiscoverySink discoverySink;
        private IMessageLogger messageLogger;
        private ManualResetEventSlim discoveryCompletion;

        public JavaScriptTestDiscoverer()
        {
            this.testRunner = new TestRunner();
            this.discoveryCompletion = new ManualResetEventSlim();

            this.SubscribeToEvents(this.testRunner.TestRunEvents);
        }

        public void DiscoverTests(IEnumerable<string> sources, IDiscoveryContext discoveryContext, IMessageLogger logger, ITestCaseDiscoverySink discoverySink)
        {
            this.discoverySink = discoverySink;
            this.messageLogger = logger;
            
            var settingsProvider = discoveryContext.RunSettings.GetSettings(AdapterConstants.SettingsName) as JavaScriptSettingsProvider;
            var settings = settingsProvider != null ? settingsProvider.Settings : new JSTestSettings();
            settings.Discovery = true;

            try
            {
                this.testRunner.StartExecution(sources, settings, null);
            }
            catch(JSTestException e)
            {
                logger.SendMessage(TestMessageLevel.Error, e.ToString());
                return;
            }

            this.discoveryCompletion.Wait();
            this.testRunner.Dispose();
        }

        private void SubscribeToEvents(ITestRunEvents testRunEvents)
        {
            testRunEvents.onTestCaseFound += onTestCaseFoundHandler;
            testRunEvents.onTestSessionEnd += onTestSessionEndHandler;
            testRunEvents.onTestMessageReceived += onTestMessageReceived;
        }

        private void onTestMessageReceived(object sender, TestMessagePayload e)
        {
            if (e.MessageLevel != TestMessageLevel.Informational)
            {
                this.messageLogger.SendMessage(e.MessageLevel, e.Message);
            }
        }

        private void onTestCaseFoundHandler(object sender, TestCaseFoundEventArgs e)
        {
            this.discoverySink.SendTestCase(e.TestCase);
        }

        private void onTestSessionEndHandler(object sender, EventArgs e)
        {
            this.discoveryCompletion.Set();
        }
    }
}