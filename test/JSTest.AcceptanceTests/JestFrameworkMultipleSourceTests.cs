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
                "suite b > test case b1",
                "suite b > test case b2",
                "suite c > test case c1",
                "suite c > test case c2",
                "suite ax > test case a1",
                "suite ax > test case a2",
                "suite bx > test case b1",
                "suite bx > test case b2",
                "suite cx > test case c1",
                "suite cx > test case c2"
            };

            this.ExpectedOutput.ExecutionOutput = new List<string>
            {
                "Passed   suite a > test case a1",
                "Failed   suite a > test case a2",
                "Passed   suite b > test case b1",
                "Failed   suite b > test case b2",
                "Passed   suite c > test case c1",
                "Failed   suite c > test case c2",
                "Passed   suite ax > test case a1",
                "Failed   suite ax > test case a2",
                "Passed   suite bx > test case b1",
                "Failed   suite bx > test case b2",
                "Passed   suite cx > test case c1",
                "Failed   suite cx > test case c2",
                "Total tests: 12. Passed: 6. Failed: 6. Skipped: 0."
            };
            this.ExpectedOutput.ExecutionWithTestsOutput = new List<string>
            {
                "Passed   suite bx > test case b1",
                "Skipped  suite bx > test case b2",
                "Passed   suite cx > test case c1",
                "Skipped  suite cx > test case c2",
                "Passed   suite ax > test case a1",
                "Skipped  suite ax > test case a2",
                "Passed   suite c > test case c1",
                "Skipped  suite c > test case c2",
                "Passed   suite b > test case b1",
                "Skipped  suite b > test case b2",
                "Passed   suite a > test case a1",
                "Failed   suite a > test case a2",
                "Total tests: 12. Passed: 6. Failed: 1. Skipped: 5."
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
        public void TestDiscoveryJest_MultipleSources()
        {
            this.TestDiscovery();
        }
    }
}
