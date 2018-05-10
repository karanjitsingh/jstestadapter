using JSTest.Settings;
using Microsoft.VisualStudio.TestPlatform.ObjectModel;
using Microsoft.VisualStudio.TestPlatform.PlatformAbstractions;
using Microsoft.VisualStudio.TestPlatform.PlatformAbstractions.Interfaces;
using System.Diagnostics;

namespace JSTest.RuntimeProviders
{
    internal class RuntimeProviderFactory
    {
        private static RuntimeProviderFactory instance;
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

        private IEnvironment environment;

        private RuntimeProviderFactory()
        {
            this.environment = new PlatformEnvironment();
        }

        public TestProcessStartInfo GetRuntimeProcessInfo(JSTestSettings settings)
        {
            switch(settings.Runtime)
            {
                case JavaScriptRuntime.NodeJS:
                    return NodeRuntimeProvider.Instance.GetRuntimeProcessInfo(settings, environment);
            }

            return null;
        }
    }
}
