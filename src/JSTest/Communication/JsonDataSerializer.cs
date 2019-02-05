namespace JSTest.Communication
{
    using System.IO;

    using Newtonsoft.Json;
    using Newtonsoft.Json.Linq;
    using Newtonsoft.Json.Serialization;

    internal class JsonDataSerializer
    {
        private static JsonDataSerializer instance;
        private JsonSerializer payloadSerializer;
        
        private JsonDataSerializer()
        {
            var jsonSettings = new JsonSerializerSettings
            {
                DateFormatHandling = DateFormatHandling.IsoDateFormat,
                DateParseHandling = DateParseHandling.DateTimeOffset,
                DateTimeZoneHandling = DateTimeZoneHandling.Utc,
                TypeNameHandling = TypeNameHandling.None,
                ReferenceLoopHandling = ReferenceLoopHandling.Ignore
            };

            this.payloadSerializer = JsonSerializer.Create(jsonSettings);
        }

        public static JsonDataSerializer Instance
        {
            get
            {
                return instance ?? (instance = new JsonDataSerializer());
            }
        }

        public Message DeserializeMessage(string rawMessage)
        {
            // Convert to VersionedMessage
            // Message can be deserialized to VersionedMessage where version will be 0
            return JsonConvert.DeserializeObject<Message>(rawMessage);
        }

        public T DeserializePayload<T>(Message message)
        {
            T retValue = default(T);

            var versionedMessage = message as Message;
            var serializer = this.payloadSerializer;

            retValue = message.Payload.ToObject<T>(serializer);
            return retValue;
        }
        public string SerializePayload(string messageType, object payload, int version)
        {
            var serializer = this.payloadSerializer;
            var serializedPayload = JToken.FromObject(payload, serializer);

            var message = version >= 1 ?
            new Message { MessageType = messageType, Version = version, Payload = serializedPayload } :
            new Message { MessageType = messageType, Payload = serializedPayload };

            return JsonConvert.SerializeObject(message);
        }
        
    }
}
