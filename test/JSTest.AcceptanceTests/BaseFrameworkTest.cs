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
        };

        private static string packageVersion;

        #endregion

        #region Protected Variables

        protected abstract string[] ContainerExtension { get; }
        
        protected ExpectedOutput ExpectedOutput { get; set; } = new ExpectedOutput(
            new List<string> {
                "test case a1",
                "test case a2",
                "test case b1",
                "test case b2",
                "test case c1",
                "test case c2"
            },

            new List<string>
            {
                "Passed   test case a1",
                "Failed   test case a2",
                "Passed   test case b1",
                "Failed   test case b2",
                "Passed   test case c1",
                "Failed   test case c2",
                "Total tests: 6. Passed: 3. Failed: 3. Skipped: 0."
            },

            new List<string>
            {
                "Passed   test case a1",
                "Passed   test case b1",
                "Passed   test case c1",
                "Total tests: 3. Passed: 3. Failed: 0. Skipped: 0."
            },
            new List<string>());

        #endregion

        #region Constructor

        public BaseFrameworkTest()
        {
        }

        #endregion

        #region Protected Methods

        protected ExecutionOutput RunTests(IEnumerable<string> files, IDictionary<string, string> cliOptions, IDictionary<string, string> runConfig)
        {
            var debug = false;

            var process = new Process();
            var startInfo = new ProcessStartInfo();

            startInfo.UseShellExecute = false;
            startInfo.WindowStyle = ProcessWindowStyle.Normal;
            startInfo.FileName = BaseFrameworkTest.vstestPath;
            startInfo.Arguments = this.BuildVSTestArgs(files, cliOptions, runConfig);
            startInfo.RedirectStandardError = true;
            startInfo.RedirectStandardOutput = true;

            if (debug)
            {
                startInfo.EnvironmentVariables.Add("JSTEST_RUNNER_DEBUG", "1");
                startInfo.EnvironmentVariables.Add("JSTEST_HOST_DEBUG", "0");
            }

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
            startInfo.Arguments = $"/C npm install --prefix ./ {package}{ (packageVersion != "" ? $"@{packageVersion}" : "") }";
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
            BaseFrameworkTest.InstallNpmPackage(package, packageVersion);
            BaseFrameworkTest.CopyRepoItems(itemFolder);
            BaseFrameworkTest.frameworkPackage = package;
            BaseFrameworkTest.frameworkName = frameworkName;
            BaseFrameworkTest.frameworkItemFolder = itemFolder;
        }

        #endregion

        #region Private Methods

        private string BuildVSTestArgs(IEnumerable<string> files, IDictionary<string, string> cliOptions, IDictionary<string, string> runConfig)
        {
            var args = $"--InIsolation --TestAdapterPath:{Path.Combine(BaseFrameworkTest.testRepoPath, "node_modules", "jstestadapter")}";

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

            BaseFrameworkTest.packageVersion = JObject.Parse(File.ReadAllText(Path.Combine(projectFolder, "package.json")))["version"].ToString();

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
            BaseFrameworkTest.InstallNpmPackage("jstestcontext", "*");
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
            var files = Directory.EnumerateFiles(BaseFrameworkTest.testRepoPath).Where((file) => this.ContainerExtension.Any((ext) => file.EndsWith(ext)));

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
            var expectedOutput = this.ExpectedOutput.DiscoveryOutput;


            this.ValidateOutput(output, expectedOutput);
        }

        public void TestExecution(IDictionary<string, string> cliArgs = null, List<string> expectedOutput = null, List<string> expectedAttachments = null, bool codeCoverageEnabled = false)
        {
            var files = Directory.EnumerateFiles(BaseFrameworkTest.testRepoPath).Where((file) => this.ContainerExtension.Any((ext) => file.EndsWith(ext)));

            var cliOptions = cliArgs != null ? cliArgs : new Dictionary<string, string>();
            var runConfig = new Dictionary<string, string>()
            {
                { "TestFramework", BaseFrameworkTest.frameworkName },
                { "DebugLogs", "true" }
            };

            if (codeCoverageEnabled)
            {
                runConfig.Add("CodeCoverageEnabled", "true");
            }

            var output = this.RunTests(files, cliOptions, runConfig);
            var expectedStdOut = expectedOutput != null ? expectedOutput : this.ExpectedOutput.ExecutionOutput;

            this.ValidateOutput(output, expectedStdOut, false);

            if (expectedAttachments != null)
            {
                string testResultsPath = null;
                if (cliArgs != null)
                {
                    testResultsPath = cliArgs["ResultsDirectory"];
                }

                if (string.IsNullOrEmpty(testResultsPath))
                {
                    throw new Exception("ResultsDirectory must be specified in order to validate the attachments");
                }

                this.ValidateAttachments(testResultsPath, expectedAttachments);
            }
        }

        public void TestExecutionWithTests()
        {
            this.TestExecution(new Dictionary<string, string>() {
                { "Tests", "1" }
            }, this.ExpectedOutput.ExecutionWithTestsOutput);
        }

        public void TestExecutionWithAttachments(List<string> expectedAttachments)
        {
            this.TestExecution(new Dictionary<string, string>() {
                { "Tests", "3" },
                { "ResultsDirectory", GetTestResultsDir() },
                { "Logger", "trx" }
            }, this.ExpectedOutput.ExecutionWithAttachmentsOutput, expectedAttachments);
        }

        public void TestExecutionWithCodeCoverage(List<string> expectedAttachments)
        {
            this.TestExecution(new Dictionary<string, string>() {
                { "ResultsDirectory", GetTestResultsDir() },
                { "Logger", "trx" }
            }, null, expectedAttachments, true);
        }

        #endregion

        #region Output Validations

        private void ValidateOutput(ExecutionOutput output, IEnumerable<string> expectedStdOut, bool failOnStdErr = true)
        {

            Assert.IsTrue(output.StdOut.Contains("JSTest: Version " + BaseFrameworkTest.packageVersion), "Console header version should match package version.");

            if (output.ProcessTimeout)
            {
                Assert.Fail("Process timed out");
            }

            if (!string.IsNullOrEmpty(output.StdErr.Trim().ToString()) && failOnStdErr)
            {
                Assert.Fail("StdErr for execution should have been empty. Value: {0}", output.StdErr);
            }

            var stdout = output.StdOut;

            foreach (var str in this.PreDefinedOutput)
            {
                Assert.IsTrue(stdout.Contains(str), "Actual StdOut did not match the expected StdOut. \n\n Did not contain: {0} \n\n {1}", str, stdout);
            }

            foreach (var str in expectedStdOut)
            {
                Assert.IsTrue(stdout.Contains(str), "Actual StdOut did not match the expected StdOut. \n\n Did not contain: {0} \n\n {1}", str, stdout);
            }

            Console.Write(stdout);
        }

        private void ValidateOutput(ExecutionOutput output, IEnumerable<string> expectedStdOut, IEnumerable<string> expectedStdErr)
        {
            this.ValidateOutput(output, expectedStdOut, false);

            var stderr = output.StdErr;

            foreach (var str in expectedStdErr)
            {
                Assert.IsTrue(stderr.Contains(str), "Actual StdErr did not match the StdErr. \n\n Did not contain: {0} \n\n {1}", str, stderr);
            }

            Console.Write(stderr);
        }

        private string GetTestResultsDir()
        {
            string testResultsRootDir = Path.Combine(Path.GetTempPath(), "jstestadapter_tests");
            if (!Directory.Exists(testResultsRootDir))
            {
                Directory.CreateDirectory(testResultsRootDir);
            }

            string testResultsDir = Path.Combine(testResultsRootDir, DateTime.UtcNow.Ticks.ToString());
            if (!Directory.Exists(testResultsDir))
            {
                Directory.CreateDirectory(testResultsDir);
            }

            return testResultsDir;
        }

        private void ValidateAttachments(string testResultsPath, List<string> attachments)
        {
            if (attachments.Count == 0)
            {
                // There should only be a .trx file, no folder should exist
                Assert.AreEqual(0, Directory.GetDirectories(testResultsPath).Length, "There should not be any attachments in the result directory");
            }
            else
            {
                string testResultFolder = Directory.GetDirectories(testResultsPath).FirstOrDefault();
                Assert.AreEqual(1, Directory.GetDirectories(testResultsPath).Length, "There should be a folder for attachments");

                var files = Directory.GetFiles(testResultFolder, "*.*", SearchOption.AllDirectories);

                HashSet<string> attachmentsOnDisk = new HashSet<string>(files.Select(f => Path.GetFileName(f)));
                Assert.AreEqual(attachments.Count, attachmentsOnDisk.Count, "Invalid number of attachments found in the test result directory");

                foreach(string attachment in attachmentsOnDisk)
                {
                    Assert.IsTrue(attachments.Contains(attachment), $"Unexpected attachment found on the disk: {attachment}");
                }
            }
        }

        #endregion
    }
}
