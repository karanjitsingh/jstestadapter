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

        public JestFramework() : base()
        {
        }


        [ClassInitialize]
        public static void ClassInitialize(TestContext context)
        {
            MochaFramework.InitializeBase("jest", "Jest", "Jest");
        }

    }
}
