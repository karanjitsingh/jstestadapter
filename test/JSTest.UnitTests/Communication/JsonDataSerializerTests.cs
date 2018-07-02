
namespace JSTest.UnitTests.Communication
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Runtime.Serialization;
    using Microsoft.VisualStudio.TestTools.UnitTesting;

    using JSTest.Communication;

    [TestClass]
    public class JsonDataSerializerTests
    {
        private JsonDataSerializer jsonDataSerializer;

        public JsonDataSerializerTests()
        {
            this.jsonDataSerializer = JsonDataSerializer.Instance;
        }

        [TestMethod]
        public void SerializePayloadShouldSerializeAnObjectWithSelfReferencingLoop()
        {
            var classWithSelfReferencingLoop = new ClassWithSelfReferencingLoop(null);
            classWithSelfReferencingLoop = new ClassWithSelfReferencingLoop(classWithSelfReferencingLoop);
            classWithSelfReferencingLoop.InfiniteRefernce.InfiniteRefernce = classWithSelfReferencingLoop;

            // This line should not throw exception
            this.jsonDataSerializer.SerializePayload("dummy", classWithSelfReferencingLoop, 1);
        }

        [TestMethod]
        public void DeserializeShouldDeserializeAnObjectWhichHadSelfReferencingLoopBeforeSerialization()
        {
            var classWithSelfReferencingLoop = new ClassWithSelfReferencingLoop(null);
            classWithSelfReferencingLoop = new ClassWithSelfReferencingLoop(classWithSelfReferencingLoop);
            classWithSelfReferencingLoop.InfiniteRefernce.InfiniteRefernce = classWithSelfReferencingLoop;

            var json = this.jsonDataSerializer.SerializePayload("dummy", classWithSelfReferencingLoop, 1);


            // This line should deserialize properly
            var result = this.jsonDataSerializer.DeserializePayload<ClassWithSelfReferencingLoop>(new Message(MessageType.ConsoleMessage, json));

            Assert.AreEqual(typeof(ClassWithSelfReferencingLoop), result.GetType());
            Assert.IsNull(result.InfiniteRefernce);
        }

        public class ClassWithSelfReferencingLoop
        {
            public ClassWithSelfReferencingLoop(ClassWithSelfReferencingLoop ir)
            {
                this.InfiniteRefernce = ir;
            }

            public ClassWithSelfReferencingLoop InfiniteRefernce
            {
                get;
                set;
            }
        }
    }
}
