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
            JestFramework.InitializeBase("jest", "Jest", "Jest");
        }

    }
}
