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

        public TestRunEvents StartExecution(IEnumerable<string> sources, JSTestSettings settings)
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
                EqtTrace.Error(e);
            }

            if (launchTask == null || launchTask.Status != TaskStatus.RanToCompletion)
            {
                EqtTrace.Error("TestRunner.StartExecution: Could not start javascript runtime.");
                return null;
            }

            //this.executionComplete.Wait();
            return this.runtimeManager.TestRunEvents;
        }

        public void Dispose()
        {
            this.runtimeManager.CleanProcessAsync(new CancellationToken()).Wait();
        }
    }
}
