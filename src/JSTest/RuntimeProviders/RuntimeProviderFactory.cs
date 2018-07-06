using JSTest.Settings;
using Microsoft.VisualStudio.TestPlatform.ObjectModel;
using Microsoft.VisualStudio.TestPlatform.PlatformAbstractions;
using Microsoft.VisualStudio.TestPlatform.PlatformAbstractions.Interfaces;
using System;
using System.Collections.Generic;
using System.Diagnostics;

namespace JSTest.RuntimeProviders
{
    internal class RuntimeProviderFactory
    {
        private static RuntimeProviderFactory instance;
        private IEnvironment environment;
        public bool IsRuntimeDebuggingEnabled {
            get
            {
                this.environment = new PlatformEnvironment();
                var hostDebugEnabled = Environment.GetEnvironmentVariable("JSTEST_RUNNER_DEBUG");
                return !string.IsNullOrEmpty(hostDebugEnabled) && hostDebugEnabled.Equals("1", StringComparison.Ordinal);
            }
        }

        public static RuntimeProviderFactory Instance
        {
            get
            {
                if (RuntimeProviderFactory.instance != null)
                {
                    return RuntimeProviderFactory.instance;
                }
                else
                {
                    return RuntimeProviderFactory.instance = new RuntimeProviderFactory();
                }
            }
        }

        public TestProcessStartInfo GetRuntimeProcessInfo(JSTestSettings settings, IEnumerable<string> sources)
        {
            switch(settings.Runtime)
            {
                case JavaScriptRuntime.NodeJS:
                    return NodeRuntimeProvider.Instance.GetRuntimeProcessInfo(this.IsRuntimeDebuggingEnabled, settings.DebugLogs, sources);
            }

            return null;
        }

        private RuntimeProviderFactory()
        {

        }
    }
}
