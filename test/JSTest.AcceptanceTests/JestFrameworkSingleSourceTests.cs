using Microsoft.VisualStudio.TestTools.UnitTesting;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace JSTest.AcceptanceTests
{

    [TestClass]
    public class JestFrameworkSingleSourceTests : BaseFrameworkTest
    {
        protected override string[] ContainerExtension
        {
            get
            {
                return new string[] { "package.json" };
            }
        }

        public JestFrameworkSingleSourceTests() : base()
        {
            this.ExpectedOutput.DiscoveryOutput = new List<string>
            {
                "suite a > test case a1",
                "suite a > test case a2",
                "suite a > test case a3",
                "suite b > test case b1",
                "suite b > test case b2",
                "suite c > test case c1",
                "suite c > test case c2",
                "suite c > test case c3"
            };

            this.ExpectedOutput.ExecutionOutput = new List<string>
            {
                "Passed   suite a > test case a1",
                "Failed   suite a > test case a2",
                "Passed   suite a > test case a3",
                "Passed   suite b > test case b1",
                "Failed   suite b > test case b2",
                "Passed   suite c > test case c1",
                "Failed   suite c > test case c2",
                "Passed   suite c > test case c3",
                "Total tests: 8. Passed: 5. Failed: 3. Skipped: 0."
            };

            this.ExpectedOutput.ExecutionWithTestsOutput = new List<string>
            {
                "Passed   suite a > test case a1",
                "Failed   suite a > test case a2",
                "Passed   suite a > test case a3",
                "Passed   suite c > test case c1",
                "Passed   suite b > test case b1",
                "Total tests: 5. Passed: 4. Failed: 1. Skipped: 0."
            };

            this.ExpectedOutput.ExecutionWithAttachmentsOutput = new List<string>
            {
                "Passed   suite a > test case a3",
                "Passed   suite c > test case c1",
                "Failed   suite c > test case c2",
                "Passed   suite c > test case c3",
                "Total tests: 4. Passed: 3. Failed: 1. Skipped: 0."
            };
        }

        [ClassInitialize]
        public static void ClassInitialize(TestContext context)
        {
            JestFrameworkMultipleSourceTests.InitializeBase("jest", "Jest", "Jest", "*");
        }

        [TestMethod]
        public void TestExecutionJest_SingleSource()
        {
            this.TestExecution();
        }

        [TestMethod]
        public void TestExecutionWithTestsJest_SingleSource()
        {
            this.TestExecutionWithTests();
        }

        [TestMethod]
        public void TestExecutionWithAttachmentsJest_SingleSource()
        {
            this.TestExecutionWithAttachments(new List<string>()
            {
                "suite-a.file1.log",
                "suite-c.file1.log",
                "suite-c.file2.log"
            });
        }

        [TestMethod]
        public void TestExecutionWithCoverageJest_SingleSource()
        {
            this.TestExecutionWithCodeCoverage(new List<string>()
            {
                "suite-a.file1.log",
                "suite-c.file1.log",
                "suite-c.file2.log",
                "clover.xml"
            });
        }

        [TestMethod]
        public void TestDiscoveryJest_SingleSource()
        {
            this.TestDiscovery();
        }
    }
}
