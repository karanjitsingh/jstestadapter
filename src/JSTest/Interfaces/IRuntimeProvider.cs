namespace JSTest.RuntimeProviders
{
    using System.Collections.Generic;
    using Microsoft.VisualStudio.TestPlatform.ObjectModel;

    internal interface IRuntimeProvider
    {
        TestProcessStartInfo GetRuntimeProcessInfo(string nodePath, string nodeModulesPath, bool debugEnabled, IEnumerable<string> sources);
    }
}
