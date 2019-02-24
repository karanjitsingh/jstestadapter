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
    public class JestFrameworkMultipleSourceTests : BaseFrameworkTest
    {
        protected override string[] ContainerExtension
        {
            get
            {
                return new string[] { "package.json", "jest.config.js" };
            }
        }

        public JestFrameworkMultipleSourceTests() : base()
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
                "suite c > test case c3",
                "suite ax > test case a1",
                "suite ax > test case a2",
                "suite ax > test case a3",
                "suite bx > test case b1",
                "suite bx > test case b2",
                "suite cx > test case c1",
                "suite cx > test case c2"
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
                "Passed   suite ax > test case a1",
                "Failed   suite ax > test case a2",
                "Passed   suite ax > test case a3",
                "Passed   suite bx > test case b1",
                "Failed   suite bx > test case b2",
                "Passed   suite cx > test case c1",
                "Failed   suite cx > test case c2",
                "Total tests: 15. Passed: 9. Failed: 6. Skipped: 0."
            };
            this.ExpectedOutput.ExecutionWithTestsOutput = new List<string>
            {
                "Passed   suite bx > test case b1",
                //"Skipped  suite bx > test case b2",
                "Passed   suite cx > test case c1",
                //"Skipped  suite cx > test case c2",
                "Passed   suite ax > test case a1",
                //"Skipped  suite ax > test case a2",
                //"Skipped  suite ax > test case a3",
                "Passed   suite c > test case c1",
                //"Skipped  suite c > test case c2",
                //"Skipped  suite c > test case c3",
                "Passed   suite b > test case b1",
                //"Skipped  suite b > test case b2",
                "Passed   suite a > test case a1",
                "Failed   suite a > test case a2",
                "Passed   suite a > test case a3",
                "Total tests: 8. Passed: 7. Failed: 1. Skipped: 0."
            };

            this.ExpectedOutput.ExecutionWithAttachmentsOutput = new List<string>
            {
                //"Skipped   suite a > test case a1",
                //"Skipped   suite a > test case a2",
                "Passed   suite a > test case a3",
                //"Skipped   suite b > test case b1",
                //"Skipped   suite b > test case b2",
                "Passed   suite c > test case c1",
                "Failed   suite c > test case c2",
                "Passed   suite c > test case c3",
                //"Skipped   suite ax > test case a1",
                //"Skipped  suite ax > test case a2",
                "Passed   suite ax > test case a3",
                //"Skipped   suite bx > test case b1",
                //"Skipped   suite bx > test case b2",
                //"Skipped   suite cx > test case c1",
                //"Skipped   suite cx > test case c2",
                "Total tests: 5. Passed: 4. Failed: 1. Skipped: 0."
            };

            this.ExpectedAttachments.Attachments = new List<string>()
            {
                "suite-a.file1.log",
                "suite-c.file1.log",
                "suite-c.file2.log",
                "suite-ax.file1.log",
                "suite-ax.file2.log",
                "suite-ax.file3.log",
            };
        }

        [ClassInitialize]
        public static void ClassInitialize(TestContext context)
        {
            JestFrameworkMultipleSourceTests.InitializeBase("jest", "Jest", "Jest", "23.6.0");
        }
        
        [TestMethod]
        public void TestExecutionJest_MultipleSources()
        {
            this.TestExecution();
        }
        
        [TestMethod]
        public void TestExecutionWithTestsJest_MultipleSources()
        {
            this.TestExecutionWithTests();
        }

        [TestMethod]
        public void TestExecutionWithAttachmentsJest_MultipleSources()
        {
            this.TestExecutionWithAttachments();
        }

        [TestMethod]
        public void TestDiscoveryJest_MultipleSources()
        {
            this.TestDiscovery();
        }
    }
}
