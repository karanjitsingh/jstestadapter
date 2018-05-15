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
    using System.Collections.Generic;

    class NodeRuntimeProvider : IRuntimeProvider
    {
        private static NodeRuntimeProvider instance;

        public static NodeRuntimeProvider Instance
        {
            get
            {
                if (NodeRuntimeProvider.instance != null)
                {
                    return NodeRuntimeProvider.instance;
                }
                else
                {
                    return NodeRuntimeProvider.instance = new NodeRuntimeProvider();
                }
            }
        }

        public TestProcessStartInfo GetRuntimeProcessInfo(IEnvironment environment, bool isDebugEnabled)
        {
            var processInfo = new TestProcessStartInfo();

            string rootFolder = Path.GetDirectoryName(typeof(TestRunner).GetTypeInfo().Assembly.GetAssemblyLocation());

#if DEBUG
            rootFolder = @"D:\JSTestAdapter\src\JSTest.Runner\bin";
#endif

            processInfo.FileName = this.getNodeBinaryPath(environment.Architecture, environment.OperatingSystem, rootFolder);
            //processInfo.WorkingDirectory = rootFolder;

            var jstestrunner = Path.Combine(rootFolder, "JSTest.Runner", "index.js");
            processInfo.EnvironmentVariables = new Dictionary<string, string>();

            // Maybe this is not required after setting working directory
            processInfo.EnvironmentVariables.Add("NODE_PATH", Environment.GetEnvironmentVariable("NODE_PATH") + ";" + Path.Combine(rootFolder, "JSTest.Runner", "node_modules"));

            processInfo.EnvironmentVariables.Add("NODE_NO_WARNINGS", "1");

            processInfo.Arguments = string.Format(
                " -r source-map-support/register {0} {1}",
                isDebugEnabled ? "--inspect-brk=9229" : "",
                jstestrunner);

            return processInfo;
        }

        private NodeRuntimeProvider()
        {

        }

        private string getNodeBinaryPath(PlatformArchitecture architecture, PlatformOperatingSystem os, string rootFolder)
        {
            string platformString = string.Empty;
            string archSuffix = string.Empty;
            string executableString = string.Empty;


            if (architecture == PlatformArchitecture.X64)
            {
                archSuffix = "x64";
            }
            else if (architecture == PlatformArchitecture.X86)
            {
                archSuffix = "x86";
            }

            if (os == PlatformOperatingSystem.Windows)
            {
                platformString = "win";
                executableString = "node.exe";
            }
            else if (os == PlatformOperatingSystem.Unix)
            {
                platformString = "linux";
                executableString = "node";
            }

            Debug.Assert(!string.IsNullOrEmpty(platformString));
            Debug.Assert(!string.IsNullOrEmpty(archSuffix));
            Debug.Assert(!string.IsNullOrEmpty(executableString));

            return String.Format(Path.Combine(rootFolder, "node", $"{platformString}-{archSuffix}", executableString));
        }

    }
}

