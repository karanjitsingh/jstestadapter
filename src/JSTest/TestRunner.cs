using JSTest.Settings;
using JSTest.JSRuntime;
using System.Collections.Generic;
using System.Diagnostics;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.VisualStudio.TestPlatform.ObjectModel;
using System;
using JSTest.Communication;
using JSTest.Interfaces;
using JSTest.RuntimeProviders;
using JSTest.Exceptions;

namespace JSTest
{
    public class TestRunner: IDisposable
    {
        private TestRuntimeManager runtimeManager;
        private ManualResetEventSlim executionComplete;

        public TestRunner()
        {
            this.executionComplete = new ManualResetEventSlim(false);
        }

        private void StartRuntimeManager(JSTestSettings settings)
        {
            var processInfo = RuntimeProviderFactory.Instance.GetRuntimeProcessInfo(settings);
            this.runtimeManager = new TestRuntimeManager(settings);

            Task<bool> launchTask = null;

            JSTestException exception = null;

            try
            {
                launchTask = Task.Run(() => this.runtimeManager.LaunchProcessAsync(processInfo, new CancellationToken()));
                launchTask.Wait();
            }
            catch (Exception e)
            {
                EqtTrace.Error(e);
                exception = new JSTestException("JSTest.TestRunner.StartExecution: Could not start javascript runtime.", e);
            }
            finally
            {
                if (exception == null && launchTask.Exception != null)
                {
                    exception = new JSTestException("JSTest.TestRunner.StartExecution: Could not start javascript runtime.", launchTask.Exception);
                }
            }

            if(exception != null)
            {
                throw exception;
            }
        }

        public ITestRunEvents StartExecution(IEnumerable<string> sources, JSTestSettings settings, CancellationToken? cancellationToken)
        {
            this.StartRuntimeManager(settings);

            if (settings.Discovery)
            {
                this.runtimeManager.SendStartDiscovery(sources);
            }
            else { 
                this.runtimeManager.SendStartExecution(sources);
            }

            //this.executionComplete.Wait();
            return this.runtimeManager.TestRunEvents;
        }

        public ITestRunEvents StartExecution(IEnumerable<TestCase> tests, JSTestSettings settings, CancellationToken? cancellationToken)
        {
            this.StartRuntimeManager(settings);

            this.runtimeManager.SendStartExecution(tests);

            //this.executionComplete.Wait();
            return this.runtimeManager.TestRunEvents;
        }

        public void Dispose()
        {
            this.runtimeManager.CleanProcessAsync(new CancellationToken()).Wait();
        }
    }
}
