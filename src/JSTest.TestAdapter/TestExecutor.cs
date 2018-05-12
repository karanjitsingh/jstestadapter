using JSTest.Communication.Payloads;
using JSTest.Exceptions;
using JSTest.Interfaces;
using JSTest.Settings;
using JSTest.TestAdapter.SettingsProvider;
using Microsoft.VisualStudio.TestPlatform.ObjectModel;
using Microsoft.VisualStudio.TestPlatform.ObjectModel.Adapter;
using Microsoft.VisualStudio.TestPlatform.ObjectModel.Logging;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Threading;

namespace JSTest.TestAdapter.SettingsProvider
{

    [ExtensionUri(AdapterConstants.ExecutorUri)]
    class JavaScriptTestExecutor : ITestExecutor
    {
        private readonly TestRunner testRunner;
        private IFrameworkHandle frameworkHandle;
        private ManualResetEventSlim executionCompletion;
        private CancellationTokenSource cancellationTokenSource;

        public JavaScriptTestExecutor()
        {
            this.testRunner = new TestRunner();
            this.executionCompletion = new ManualResetEventSlim();
            this.cancellationTokenSource = new CancellationTokenSource();

            this.SubscribeToEvents(this.testRunner.TestRunEvents);
        }

        public void Cancel()
        {
            this.cancellationTokenSource.Cancel();
        }


        public void RunTests(IEnumerable<TestCase> tests, IRunContext runContext, IFrameworkHandle frameworkHandle)
        {
            this.frameworkHandle = frameworkHandle;

            var settingsProvider = runContext.RunSettings.GetSettings(AdapterConstants.SettingsName) as JavaScriptSettingsProvider;
            var settings = settingsProvider != null ? settingsProvider.Settings : new JSTestSettings();

            try
            {
                this.testRunner.StartExecution(tests, settings, this.cancellationTokenSource.Token);
            }
            catch (JSTestException e)
            {
                frameworkHandle.SendMessage(TestMessageLevel.Error, e.ToString());
                return;
            }

            executionCompletion.Wait();
            this.testRunner.Dispose();

        }

        public void RunTests(IEnumerable<string> sources, IRunContext runContext, IFrameworkHandle frameworkHandle)
        {
            this.frameworkHandle = frameworkHandle;

            var settingsProvider = runContext.RunSettings.GetSettings(AdapterConstants.SettingsName) as JavaScriptSettingsProvider;
            var settings = settingsProvider != null ? settingsProvider.Settings : new JSTestSettings();

            try
            {
                this.testRunner.StartExecution(sources, settings, this.cancellationTokenSource.Token);
            }
            catch (JSTestException e)
            {
                frameworkHandle.SendMessage(TestMessageLevel.Error, e.ToString());
                return;
            }

            executionCompletion.Wait();
            this.testRunner.Dispose();
        }

        private void SubscribeToEvents(ITestRunEvents testRunEvents)
        {
            testRunEvents.onTestCaseStart += this.onTestCaseStartHandler;
            testRunEvents.onTestCaseEnd += this.onTestCaseEndHandler;
            testRunEvents.onTestSessionEnd += this.onTestSessionEndHandler;
            testRunEvents.onTestMessageReceived += this.onTestMessageReceived;
        }

        private void onTestMessageReceived(object sender, TestMessagePayload e)
        {
            if (e.MessageLevel != TestMessageLevel.Informational)
            {
                this.frameworkHandle.SendMessage(e.MessageLevel, e.Message);
            }
        }

        private void onTestCaseStartHandler(object sender, TestCaseStartEventArgs e)
        {
            this.frameworkHandle.RecordStart(e.TestCase);
        }

        private void onTestCaseEndHandler(object sender, TestCaseEndEventArgs e)
        {
            this.frameworkHandle.RecordResult(e.TestResult);
        }

        private void onTestSessionEndHandler(object sender, EventArgs e)
        {
            this.executionCompletion.Set();
        }
    }
}
