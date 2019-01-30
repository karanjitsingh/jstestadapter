using System;
using System.Collections.Generic;

using JSTest.Settings;

using Microsoft.VisualStudio.TestPlatform.ObjectModel;

namespace JSTest.RuntimeProviders
{
    internal class RuntimeProcessInfoProvider
    {
        private RuntimeProcessInfoProvider()
        {
        }

        public bool IsRuntimeDebuggingEnabled
        {
            get
            {
                var hostDebugEnabled = Environment.GetEnvironmentVariable("JSTEST_RUNNER_DEBUG");
                return !string.IsNullOrEmpty(hostDebugEnabled) && hostDebugEnabled.Equals("1", StringComparison.Ordinal);
            }
        }

        public static RuntimeProcessInfoProvider Instance { get; } = new RuntimeProcessInfoProvider();

        public TestProcessStartInfo GetRuntimeProcessInfo(JSTestSettings settings, IEnumerable<string> sources)
        {
            switch (settings.Runtime)
            {
                case JavaScriptRuntime.NodeJS:
                    return NodeRuntimeProvider.Instance.GetRuntimeProcessInfo(settings.NodePath, this.IsRuntimeDebuggingEnabled, sources);
            }

            return null;
        }
    }
}
