using System;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using JSTest.Settings;
using System.IO;
using System.Reflection;
using System.Linq;
using System.Diagnostics;
using System.Collections;
using System.Collections.Generic;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;


namespace JSTest.AcceptanceTests
{
    [TestClass]
    public abstract class BaseFrameworkTest
    {
        #region Static Variables

        private static string testRepoPath;
        private static string jstestPackage;
        private static string vstestPath;
        private static string testExecutionDirectory;
        private static string frameworkName;
        private static string frameworkPackage;
        private static string frameworkItemFolder;

        #endregion

        #region Private Variables

        private readonly IEnumerable<string> PreDefinedOutput = new List<string>()
        {
            "Logging JSTet.Runner Diagnostics in file",
            "Connected to client with",
            "Process Launched with id",
            "Process with id"
        };

        #endregion

        #region Protected Variables

        protected abstract string ContainerExtension { get; }

        #endregion

        #region Constructor

        public BaseFrameworkTest()
        {
        }

        #endregion

        #region Protected Methods

        protected ExecutionOutput RunTests(IEnumerable<string> files, IDictionary<string, string> cliOptions, IDictionary<string, string> runConfig)
        {
            var process = new Process();
            var startInfo = new ProcessStartInfo();

            startInfo.UseShellExecute = false;
            startInfo.WindowStyle = ProcessWindowStyle.Normal;
            startInfo.FileName = BaseFrameworkTest.vstestPath;
            startInfo.Arguments = this.BuildVSTestArgs(files, cliOptions, runConfig);
            startInfo.RedirectStandardError = true;
            startInfo.RedirectStandardOutput = true;

            process.StartInfo = startInfo;
            process.StartInfo.UseShellExecute = false;

            Console.Write($"{startInfo.FileName} {startInfo.Arguments}");

            return new ExecutionOutput(process);
        }

        protected static void InstallNpmPackage(string package, string packageVersion = "")
        {
            var process = new Process();
            var startInfo = new ProcessStartInfo();

            startInfo.UseShellExecute = false;
            startInfo.WindowStyle = ProcessWindowStyle.Hidden;
            startInfo.FileName = "cmd.exe";
            startInfo.WorkingDirectory = BaseFrameworkTest.testRepoPath;
            startInfo.Arguments = $"/C npm install {package}{ (packageVersion != "" ? $"@{packageVersion}" : "") } --silent";
            startInfo.RedirectStandardError = true;
            startInfo.RedirectStandardOutput = true;

            process.StartInfo = startInfo;
            process.StartInfo.UseShellExecute = false;

            process.OutputDataReceived += (sender, data) => BaseFrameworkTest.PrintOutputToConsole(data);
            process.ErrorDataReceived += (sender, data) => BaseFrameworkTest.PrintOutputToConsole(data, true);

            process.Start();

            process.BeginErrorReadLine();
            process.BeginOutputReadLine();

            process.WaitForExit();
        }

        protected static void CopyRepoItems(string testFrameworkName)
        {
            var testFrameworkItems = Path.Combine(BaseFrameworkTest.testExecutionDirectory, testFrameworkName);

            if (!Directory.Exists(testFrameworkItems))
            {
                throw new Exception("Could not find items for test framework " + testFrameworkName);
            }

            //Create Directories
            foreach (string dirPath in Directory.GetDirectories(testFrameworkItems, "*",
                SearchOption.AllDirectories))
                Directory.CreateDirectory(dirPath.Replace(testFrameworkItems, BaseFrameworkTest.testRepoPath));

            //Copy all the files
            foreach (string newPath in Directory.GetFiles(testFrameworkItems, "*.*",
                SearchOption.AllDirectories))
                File.Copy(newPath, newPath.Replace(testFrameworkItems, BaseFrameworkTest.testRepoPath), true);
        }

        protected static void InitializeBase(string package, string frameworkName, string itemFolder, string packageVersion = "")
        {
            BaseFrameworkTest.InitializePaths();
            BaseFrameworkTest.InitializeTempFolder();
            BaseFrameworkTest.InstallNpmPackage(package);
            BaseFrameworkTest.CopyRepoItems(itemFolder);
            BaseFrameworkTest.frameworkPackage = package;
            BaseFrameworkTest.frameworkName = frameworkName;
            BaseFrameworkTest.frameworkItemFolder = itemFolder;
        }

        #endregion

        #region Private Methods

        private string BuildVSTestArgs(IEnumerable<string> files, IDictionary<string, string> cliOptions, IDictionary<string, string> runConfig)
        {
            var args = $"--Inisolation --TestAdapterPath:{Path.Combine(BaseFrameworkTest.testRepoPath, "node_modules", "jstestadapter")}";

            foreach (var entry in cliOptions)
            {
                args += " --" + entry.Key + (!string.IsNullOrEmpty(entry.Value) ? ":" + entry.Value : string.Empty);
            }

            foreach (var file in files)
            {
                args += $" {file}";
            }

            if (runConfig.Count > 0)
            {
                args += " --";
            }

            foreach (var entry in runConfig)
            {
                args += $" JSTest.{entry.Key}={entry.Value}";
            }

            return args;
        }

        private static void PrintOutputToConsole(DataReceivedEventArgs data, bool error = false)
        {
            if (error)
            {
                Console.Error.Write(data.Data + Environment.NewLine);
            }
            else
            {
                Console.Write(data.Data + Environment.NewLine);
            }
        }

        private static void InitializePaths()
        {
            do
            {
                BaseFrameworkTest.testRepoPath = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString());
            } while (Directory.Exists(testRepoPath));

            // This dll resides in folder: ...\JSTestAdapter\test\JSTest.AcceptanceTests\bin\Debug
            var projectFolder = Directory.GetParent(Assembly.GetExecutingAssembly().Location).Parent.Parent.Parent.Parent.Parent.FullName;

#if DEBUG
            var config = "Debug";
#else
            var config = "Release";
#endif

            var jstestPackageFolder = Path.Combine(projectFolder, "artifacts", config);

            var packageVersion = JObject.Parse(File.ReadAllText(Path.Combine(projectFolder, "package.json")))["version"];
            var package = Directory.EnumerateFiles(jstestPackageFolder, $"jstestadapter-{packageVersion}.tgz", SearchOption.TopDirectoryOnly);

            BaseFrameworkTest.jstestPackage = package.First();
            BaseFrameworkTest.vstestPath = Path.Combine(Path.GetDirectoryName(Process.GetCurrentProcess().MainModule.FileName), "vstest.console.exe");

            if (!File.Exists(BaseFrameworkTest.vstestPath))
            {
                throw new Exception($"Could not find {BaseFrameworkTest.vstestPath}");
            }

            BaseFrameworkTest.testExecutionDirectory = Directory.GetParent(Assembly.GetExecutingAssembly().Location).FullName;
        }

        private static void InitializeTempFolder()
        {
            Directory.CreateDirectory(testRepoPath);
            BaseFrameworkTest.InstallNpmPackage(BaseFrameworkTest.jstestPackage);
        }

        #endregion

        #region TestMethods

        [ClassCleanup]
        public static void Cleanup()
        {
            Directory.Delete(BaseFrameworkTest.testRepoPath, true);
        }

        public void TestDiscovery()
        {
            var filesInDirectory = Directory.EnumerateFiles(BaseFrameworkTest.testRepoPath);
            var files = filesInDirectory.Where((file) => file.EndsWith(this.ContainerExtension));

            var cliOptions = new Dictionary<string, string>
            {
                { "listtests", "" }
            };
            var runConfig = new Dictionary<string, string>()
            {
                { "TestFramework", BaseFrameworkTest.frameworkName },
                { "DebugLogs", "true" }
            };

            var output = this.RunTests(files, cliOptions, runConfig);
            var expectedOutput = new List<string> { "test case a1", "test case a2", "test case b1", "test case b2" };

            this.ValidateOutput(output, expectedOutput);
        }

        protected virtual List<string> GetExpectedTestOutput()
        {
            return new List<string>
            {
                "Passed   test case a1",
                "Failed   test case a2",
                "Passed   test case b1",
                "Failed   test case b2"
            };
        }

        public void TestExecution()
        {
            var files = Directory.EnumerateFiles(BaseFrameworkTest.testRepoPath).Where((file) => file.EndsWith(this.ContainerExtension));

            var cliOptions = new Dictionary<string, string>();
            var runConfig = new Dictionary<string, string>()
            {
                { "TestFramework", BaseFrameworkTest.frameworkName },
                { "DebugLogs", "true" }
            };

            var output = this.RunTests(files, cliOptions, runConfig);
            var expectedStdOut = this.GetExpectedTestOutput();

            this.ValidateOutput(output, expectedStdOut, false);
        }

        #endregion

        #region Output Validations

        private void ValidateOutput(ExecutionOutput output, IEnumerable<string> expectedStdOut, bool failOnStdErr = true)
        {
            if (output.ProcessTimeout)
            {
                Assert.Fail("Process timed out");
            }

            if (!string.IsNullOrEmpty(output.StdErr.Trim().ToString()) && failOnStdErr)
            {
                Assert.Fail("StandardError for execution should have been empty");
            }

            var stdout = output.StdOut;

            foreach (var str in this.PreDefinedOutput)
            {
                if (!stdout.Contains(str))
                {
                    Console.Error.Write("Expected output:\n", stdout);
                }
                Assert.IsTrue(stdout.Contains(str), "Actual StdOut did not match the expected StdOut");
            }

            foreach (var str in expectedStdOut)
            {
                if(!stdout.Contains(str))
                {
                    Console.Error.Write("Expected output:\n", stdout);
                }
                Assert.IsTrue(stdout.Contains(str), "Actual StdOut did not match the expected StdOut");
            }

            Console.Write(stdout);
        }

        private void ValidateOutput(ExecutionOutput output, IEnumerable<string> expectedStdOut, IEnumerable<string> expectedStdErr)
        {
            this.ValidateOutput(output, expectedStdOut, false);

            var stderr = output.StdErr;

            foreach (var str in expectedStdErr)
            {
                if (!stderr.Contains(str))
                {
                    Console.Error.Write("Expected error:\n", stderr);
                }

                Assert.IsTrue(stderr.Contains(str), "Actual StdErr did not match the StdErr");
            }

            Console.Write(stderr);
        }

        #endregion
    }
}
