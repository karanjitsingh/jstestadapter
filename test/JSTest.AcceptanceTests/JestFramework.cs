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
    public class JestFramework : BaseFrameworkTest
    {
        protected override string ContainerExtension
        {
            get
            {
                return "package.json";
            }
        }

        public JestFramework() : base()
        {
        }


        [ClassInitialize]
        public static void ClassInitialize(TestContext context)
        {
            JestFramework.InitializeBase("jest", "Jest", "Jest", "22.4.2");
        }

        [TestMethod]
        public void TestExecutionJest()
        {
            this.TestExecution();
        }

        [TestMethod]
        public void TestDiscoveryJest()
        {
            this.TestDiscovery();
        }

        protected virtual List<string> GetExpectedOutput()
        {
            return new List<string>
            {
                "Passed   suite a > test case a1",
                "Failed   suite a > test case a2",
                "Passed   suite b > test case b1",
                "Failed   suite b > test case b2"
            };
        }
    }
}
