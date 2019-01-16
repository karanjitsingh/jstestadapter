using JSTest.Communication.Payloads;
using JSTest.Interfaces;
using JSTest.Settings;
using Microsoft.VisualStudio.TestPlatform.ObjectModel;
using Microsoft.VisualStudio.TestPlatform.ObjectModel.Adapter;
using Microsoft.VisualStudio.TestPlatform.ObjectModel.Logging;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Threading;

namespace JSTest.TestAdapter
{

    [ExtensionUri(JSTestAdapterConstants.ExecutorUri)]
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

            var settingsProvider = runContext.RunSettings.GetSettings(JSTestAdapterConstants.SettingsName) as JavaScriptSettingsProvider;
            var settings = settingsProvider != null ? settingsProvider.Settings : new JSTestSettings();

            try
            {
                this.testRunner.StartExecution(tests, settings, this.cancellationTokenSource.Token);
            }
            catch (JSTestException e)
            {
                frameworkHandle.SendMessage(TestMessageLevel.Error, e.ToString());

                if (e.InnerException is TimeoutException)
                {
                    this.testRunner.Dispose();
                }

                return;
            }

            executionCompletion.Wait();
            this.testRunner.Dispose();

        }

        public void RunTests(IEnumerable<string> sources, IRunContext runContext, IFrameworkHandle frameworkHandle)
        {
            this.frameworkHandle = frameworkHandle;

            var settingsProvider = runContext.RunSettings.GetSettings(JSTestAdapterConstants.SettingsName) as JavaScriptSettingsProvider;
            var settings = settingsProvider != null ? settingsProvider.Settings : new JSTestSettings();

            try
            {
                this.testRunner.StartExecution(sources, settings, this.cancellationTokenSource.Token);
            }
            catch (JSTestException e)
            {
                frameworkHandle.SendMessage(TestMessageLevel.Error, e.ToString());

                EqtTrace.Error("TestExecutor: Starting test execution failed with the following exception: {0}", e);
                this.testRunner.Dispose();

                return;
            }

            executionCompletion.Wait();
            this.testRunner.Dispose();
        }

        private void SubscribeToEvents(ITestRunEvents testRunEvents)
        {
            testRunEvents.onTestCaseStart += this.OnTestCaseStartHandler;
            testRunEvents.onTestCaseEnd += this.OnTestCaseEndHandler;
            testRunEvents.onTestSessionEnd += this.OnTestSessionEndHandler;
            testRunEvents.onTestMessageReceived += this.OnTestMessageReceived;
        }

        private void OnTestMessageReceived(object sender, TestMessagePayload e)
        {
            if (e.MessageLevel != TestMessageLevel.Informational)
            {
                this.frameworkHandle.SendMessage(e.MessageLevel, e.Message);
            }
        }

        private void OnTestCaseStartHandler(object sender, TestCaseStartEventArgs e)
        {
            this.frameworkHandle.RecordStart(e.TestCase);
        }

        private void OnTestCaseEndHandler(object sender, TestCaseEndEventArgs e)
        {
            this.frameworkHandle.RecordResult(e.TestResult);
        }

        private void OnTestSessionEndHandler(object sender, EventArgs e)
        {
            this.executionCompletion.Set();
        }
    }
}
