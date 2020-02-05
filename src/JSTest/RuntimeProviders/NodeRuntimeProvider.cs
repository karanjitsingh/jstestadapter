namespace JSTest.RuntimeProviders
{
    using System;
    using System.Collections.Generic;
    using System.Globalization;
    using System.IO;
    using System.Reflection;

    using Microsoft.VisualStudio.TestPlatform.ObjectModel;
    using Microsoft.VisualStudio.TestPlatform.PlatformAbstractions;

    internal class NodeRuntimeProvider : IRuntimeProvider
    {
        public static NodeRuntimeProvider Instance { get; } = new NodeRuntimeProvider();

        public TestProcessStartInfo GetRuntimeProcessInfo(string nodePath, string rootFolder, bool isDebugEnabled, IEnumerable<string> sources)
        {
            var processInfo = new TestProcessStartInfo();

            if (!string.IsNullOrWhiteSpace(nodePath))
            {
                processInfo.FileName = nodePath;

                if (!string.Equals(Path.GetFileName(nodePath).ToLowerInvariant(), "node.exe", StringComparison.OrdinalIgnoreCase))
                {
                    throw new InvalidDataException($"NodePath specified in the run settings {nodePath} doesnot point to node.exe");
                }

                if (!File.Exists(nodePath))
                {
                    throw new InvalidDataException($"NodePath specified in the run settings {nodePath} doesnot exist");
                }
            }
            else
            {
                processInfo.FileName = "node.exe";
            }

            if (string.IsNullOrWhiteSpace(rootFolder))
            {
                rootFolder = Path.GetDirectoryName(typeof(TestRunner).GetTypeInfo().Assembly.GetAssemblyLocation());
            }


            var jstestrunner = Path.Combine(rootFolder, "index.js");
            processInfo.EnvironmentVariables = new Dictionary<string, string>
            {
                { "NODE_PATH", InitNodePath(sources, rootFolder) },
                { "NODE_NO_WARNINGS", "1" }
            };

            processInfo.Arguments = string.Format(CultureInfo.InvariantCulture,
                " -r source-map-support/register {0} {1}", isDebugEnabled ? "--inspect-brk=9229" : string.Empty, jstestrunner);

            return processInfo;
        }

        private string InitNodePath(IEnumerable<string> sources, string root)
        {
            var node_path = Environment.GetEnvironmentVariable("NODE_PATH");
            if (!string.IsNullOrEmpty(node_path))
            {
                node_path += ";";
            }

            node_path += Path.Combine(root, "node_modules");

            HashSet<string> paths = new HashSet<string>();
            foreach (var src in sources)
            {
                var path = Path.GetDirectoryName(src);

                while (!string.IsNullOrEmpty(path) && !paths.Contains(path))
                {
                    var node_m = Path.Combine(path, "node_modules");
                    if (Directory.Exists(node_m))
                    {
                        node_path += ";" + node_m;
                    }
                    paths.Add(path);
                    path = Path.GetDirectoryName(path);
                }
            }

            return node_path;
        }

        private NodeRuntimeProvider()
        {

        }
    }
}

