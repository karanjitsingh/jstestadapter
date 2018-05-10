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

            try
            {
                launchTask = Task.Run(() => this.runtimeManager.LaunchProcessAsync(processInfo, new CancellationToken()));
                launchTask.Wait();
            }
            catch (Exception e)
            {
                EqtTrace.Error("TestRunner.StartExecution: Could not start javascript runtime.");
                throw new Exception();
            }

            if (launchTask == null || launchTask.Status != TaskStatus.RanToCompletion || launchTask.Exception != null)
            {
                EqtTrace.Error("TestRunner.StartExecution: Could not start javascript runtime.");
                throw new Exception();
            }

        }

        public ITestRunEvents StartExecution(IEnumerable<string> sources, JSTestSettings settings)
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

        public ITestRunEvents StartExecution(IEnumerable<TestCase> tests, JSTestSettings settings)
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
