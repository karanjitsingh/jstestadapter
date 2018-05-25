

namespace JSTest
{
    using System;
    using System.Collections.Generic;
    using System.Diagnostics;
    using System.Threading;
    using System.Threading.Tasks;

    using Microsoft.VisualStudio.TestPlatform.ObjectModel;
    
    using JSTest.Interfaces;
    using JSTest.RuntimeProviders;
    using JSTest.Settings;


    public class TestRunner: IDisposable
    {
        private TestRuntimeManager runtimeManager;
        private readonly ManualResetEventSlim executionComplete;
        private readonly TestRunEvents testRunEvents;

        public ITestRunEvents TestRunEvents
        {
            get
            {
                return this.testRunEvents;
            }
        }

        public TestRunner()
        {
            this.executionComplete = new ManualResetEventSlim(false);
            this.testRunEvents = new TestRunEvents();
        }

        private void StartRuntimeManager(JSTestSettings settings, IEnumerable<string> sources)
        {
            var processInfo = RuntimeProviderFactory.Instance.GetRuntimeProcessInfo(settings, sources);
            this.runtimeManager = new TestRuntimeManager(settings, this.testRunEvents);

            Task<bool> launchTask = null;

            JSTestException exception = null;

            try
            {
                launchTask = Task.Run(() => this.runtimeManager.LaunchProcessAsync(processInfo, new CancellationToken()));

                if (!launchTask.Wait(RuntimeProviderFactory.Instance.IsRuntimeDebuggingEnabled
                                    ? Constants.InfiniteTimout
                                    : Constants.StandardWaitTimout))
                {
                    throw new TimeoutException("Process launch timeout.");
                }
            }
            catch (Exception e)
            {
                this.testRunEvents.DisableInvoke = true;

                EqtTrace.Error(e);
                exception = new JSTestException("JSTest.TestRunner.StartExecution: Could not start javascript runtime.");
            }
            finally
            {
                if (exception == null && launchTask.Exception != null)
                {
                    EqtTrace.Error(launchTask.Exception);
                    exception = new JSTestException("JSTest.TestRunner.StartExecution: Could not start javascript runtime.");
                }
            }

            if(exception != null)
            {
                throw exception;
            }
        }

        public void StartExecution(IEnumerable<string> sources, JSTestSettings settings, CancellationToken? cancellationToken)
        {
            this.StartRuntimeManager(settings, sources);

            if (settings.Discovery)
            {
                this.runtimeManager.SendStartDiscovery(sources);
            }
            else
            { 
                this.runtimeManager.SendStartExecution(sources);
            }
        }

        public void StartExecution(IEnumerable<TestCase> tests, JSTestSettings settings, CancellationToken? cancellationToken)
        {
            var list = new List<string>();

            foreach(var test in tests)
            {
                if(!string.IsNullOrEmpty(test.CodeFilePath))
                {
                    list.Add(test.CodeFilePath);
                }
            }

            this.StartRuntimeManager(settings, list);
            this.runtimeManager.SendStartExecution(tests);
        }

        public void Dispose()
        {
            this.runtimeManager.CleanProcessAsync().Wait();
        }
    }
}
