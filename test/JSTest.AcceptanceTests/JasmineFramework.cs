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
    public class JasmineFramework : BaseFrameworkTest
    {

        protected override string ContainerExtension
        {
            get
            {
                return ".js";
            }
        }

        public JasmineFramework() : base()
        {
        }


        [ClassInitialize]
        public static void ClassInitialize(TestContext context)
        {
            JasmineFramework.InitializeBase("jasmine", "Jasmine", "Jasmine");
        }

        [TestMethod]
        public void TestExecutionJasmine()
        {
            this.TestExecution();
        }

        [TestMethod]
        public void TestDiscoveryJasmine()
        {
            this.TestDiscovery();
        }
    }
}
