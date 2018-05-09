using JSTest.Settings;
using JSTest.JSRuntime;
using System.Collections.Generic;
using System.Diagnostics;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.VisualStudio.TestPlatform.ObjectModel;
using System;

namespace JSTest
{
    public class TestRunner
    {
        private RuntimeManager runtimeManager;

        public TestRunEvents StartExecution(IEnumerable<string> sources, JSTestSettings settings) {

            var processInfo = RuntimeProviderFactory.Instance.GetRuntimeProcessInfo(settings);
            this.runtimeManager = new RuntimeManager(settings);

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

            if (launchTask != null || launchTask.Status != TaskStatus.RanToCompletion)
            {
                EqtTrace.Error("TestRunner.StartExecution: Could not start javascript runtime.");
                return null;
            }

            return this.runtimeManager.TestRunEvents;
        }        
    }
}
