// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

namespace JSTest.RuntimeProviders
{
    using System;
    using System.Diagnostics;
    using System.IO;
    using System.Reflection;

    using Microsoft.VisualStudio.TestPlatform.ObjectModel;
    using Microsoft.VisualStudio.TestPlatform.PlatformAbstractions;
    using Microsoft.VisualStudio.TestPlatform.PlatformAbstractions.Interfaces;

    using JSTest.Settings;

    class NodeRuntimeProvider : IRuntimeProvider
    {
        private JSTestSettings settings;
        private IEnvironment environment;

        public NodeRuntimeProvider() : this(new PlatformEnvironment(), new ProcessHelper()) { }

        public NodeRuntimeProvider(IEnvironment environment, IProcessHelper processHelper)
        {
            this.environment = environment;
        }

        public void Initialize(JSTestSettings settings)
        {
            this.settings = settings;
        }


        public TestProcessStartInfo GetRuntimeProcessInfo()
        {
            var processInfo = new TestProcessStartInfo();
            string rootFolder = Path.GetDirectoryName(typeof(TestRunner).GetTypeInfo().Assembly.GetAssemblyLocation());

            processInfo.FileName = this.getNodeBinaryPath(rootFolder);

            var jstesthost = Path.Combine(rootFolder, "JSTestHost", "index.js");

            var hostDebugEnabled = Environment.GetEnvironmentVariable("JSTEST_HOST_DEBUG");
            var debug = !string.IsNullOrEmpty(hostDebugEnabled) && hostDebugEnabled.Equals("1", StringComparison.Ordinal);

            processInfo.EnvironmentVariables.Add("NODE_PATH", Environment.GetEnvironmentVariable("NODE_PATH") + ";" + Path.Combine(rootFolder, "JSTestHost", "node_modules"));

            processInfo.EnvironmentVariables.Add("NODE_NO_WARNINGS", "1");
            //processInfo.EnvironmentVariables.Add("NODE_DEBUG", "module");

            processInfo.Arguments = string.Format(
                " -r source-map-support/register {0} {1} {2}",
                debug ? "--inspect-brk=9229" : "",
                jstesthost,
                $"--framework {this.settings.TestFramework}");

            return processInfo;
        }

        private string getNodeBinaryPath(string rootFolder)
        {
            string platform = string.Empty;
            string architecture = string.Empty;
            string executable = string.Empty;


            if (this.environment.Architecture == PlatformArchitecture.X64)
            {
                architecture = "x64";
            }
            else if (this.environment.Architecture == PlatformArchitecture.X86)
            {
                architecture = "x86";
            }

            if (this.environment.OperatingSystem == PlatformOperatingSystem.Windows)
            {
                platform = "win";
                executable = "node.exe";
            }
            else if (this.environment.OperatingSystem == PlatformOperatingSystem.Unix)
            {
                platform = "linux";
                executable = "node";
            }

            Debug.Assert(!string.IsNullOrEmpty(platform));
            Debug.Assert(!string.IsNullOrEmpty(architecture));
            Debug.Assert(!string.IsNullOrEmpty(executable));

            return String.Format(Path.Combine(rootFolder, "node", $"{platform}-{architecture}", executable));
        }

    }
}

