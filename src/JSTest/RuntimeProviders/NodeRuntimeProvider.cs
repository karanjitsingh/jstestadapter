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

        public TestProcessStartInfo GetRuntimeProcessInfo(IEnvironment environment, bool isDebugEnabled, IEnumerable<string> sources)
        {
            var processInfo = new TestProcessStartInfo();

            string rootFolder = Path.GetDirectoryName(typeof(TestRunner).GetTypeInfo().Assembly.GetAssemblyLocation());

            processInfo.FileName = "node";
            //processInfo.WorkingDirectory = rootFolder;

            var jstestrunner = Path.Combine(rootFolder, "index.js");
            processInfo.EnvironmentVariables = new Dictionary<string, string>();

            

            processInfo.EnvironmentVariables.Add("NODE_PATH", initNodePath(sources, rootFolder));

            //processInfo.EnvironmentVariables.Add("NODE_DEBUG", "module");
            processInfo.EnvironmentVariables.Add("NODE_NO_WARNINGS", "1");

            processInfo.Arguments = string.Format(
                " -r source-map-support/register {0} {1}",
                isDebugEnabled ? "--inspect-brk=9229" : "",
                jstestrunner);

            return processInfo;
        }

        private string initNodePath(IEnumerable<string> sources, string root)
        {
            var node_path = Environment.GetEnvironmentVariable("NODE_PATH");
            if(!string.IsNullOrEmpty(node_path))
            {
                node_path += ";";
            }

            node_path += Path.Combine(root, "node_modules");


            HashSet<string> paths = new HashSet<string>();

            //processInfo.EnvironmentVariables.Add("NODE_PATH", Environment.GetEnvironmentVariable("NODE_PATH") + ";" + Path.Combine(rootFolder, "node_modules"));
            foreach(var src in sources)
            {
                var path = Path.GetDirectoryName(src);
                
                while(!String.IsNullOrEmpty(path) && !paths.Contains(path))
                {
                    var node_m = Path.Combine(path, "node_modules");
                    if (Directory.Exists(node_m))
                    {
                        node_path += ";" + node_m;
                    }
                    paths.Add(path);
                    path = Path.GetDirectoryName(src);
                }
            }

            return node_path;
        }

        private NodeRuntimeProvider()
        {

        }
    }
}

