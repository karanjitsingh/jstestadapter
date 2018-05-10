using JSTest.Communication.Payloads;
using JSTest.Interfaces;
using JSTest.Settings;
using Microsoft.VisualStudio.TestPlatform.ObjectModel;
using Microsoft.VisualStudio.TestPlatform.ObjectModel.Adapter;
using Microsoft.VisualStudio.TestPlatform.ObjectModel.Logging;
using System;
using System.Collections.Generic;
using System.Text;
using System.Threading;

namespace JSTest.TestAdapter
{
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
        }

        public void Cancel()
        {
            this.cancellationTokenSource.Cancel();
        }


        public void RunTests(IEnumerable<TestCase> tests, IRunContext runContext, IFrameworkHandle frameworkHandle)
        {
            this.frameworkHandle = frameworkHandle;
            var settings = new JSTestSettings();

            var events = this.testRunner.StartExecution(tests, settings, this.cancellationTokenSource.Token);
            this.SubscribeAndWaitForCompletion(events);
        }

        public void RunTests(IEnumerable<string> sources, IRunContext runContext, IFrameworkHandle frameworkHandle)
        {
            this.frameworkHandle = frameworkHandle;
            var settings = new JSTestSettings();

            var events = this.testRunner.StartExecution(sources, settings, this.cancellationTokenSource.Token);
            this.SubscribeAndWaitForCompletion(events);
        }

        private void SubscribeAndWaitForCompletion(ITestRunEvents events)
        {
            events.onTestCaseStart += this.onTestCaseStartHandler;
            events.onTestCaseEnd += this.onTestCaseEndHandler;
            events.onTestSessionEnd += this.onTestSessionEndHandler;
            events.onTestMessageReceived += this.onTestMessageReceived;

            this.executionCompletion.Wait();
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
