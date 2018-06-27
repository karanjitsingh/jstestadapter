namespace JSTest.UnitTests.Communication
{
    using System;
    using System.IO;
    using System.Net;
    using System.Net.Sockets;
    using System.Text;
    using System.Threading;
    using System.Threading.Tasks;
    using JSTest.Communication;
    using Microsoft.VisualStudio.TestTools.UnitTesting;

    [TestClass]
    public class SocketCommunicationManagerTests : IDisposable
    {
        private const string TestDiscoveryStartMessageWithNullPayload = "{\"MessageType\":\"TestDiscovery.Start\",\"Payload\":null}";

        private const string TestDiscoveryStartMessageWithDummyPayload = "{\"MessageType\":\"TestDiscovery.Start\",\"Payload\":\"Dummy Payload\"}";

        private const string TestDiscoveryStartMessageWithVersionAndPayload = "{\"Version\":2,\"MessageType\":\"TestDiscovery.Start\",\"Payload\":\"Dummy Payload\"}";

        private const string DummyPayload = "Dummy Payload";

        private readonly CommunicationChannel communicationManager;

        private readonly TcpClient tcpClient;

        private readonly TcpListener tcpListener;

        public SocketCommunicationManagerTests()
        {
            this.communicationManager = new CommunicationChannel();
            this.tcpClient = new TcpClient();
            this.tcpListener = new TcpListener(IPAddress.Loopback, 0);
        }

        public void Dispose()
        {
            this.tcpListener.Stop();
#if NET451
            // tcpClient.Close() calls tcpClient.Dispose().
            this.tcpClient?.Close();
#else
            // tcpClient.Close() not available for netcoreapp1.0
            this.tcpClient?.Dispose();
#endif
            this.communicationManager.StopServer();
            //this.communicationManager.StopClient();
        }

        #region Server tests

        [TestMethod]
        public async Task HostServerShouldStartServerAndReturnPortNumber()
        {
            var port = this.communicationManager.HostServer(new IPEndPoint(IPAddress.Loopback, 0)).Port;

            Assert.IsTrue(port > 0);
            await this.tcpClient.ConnectAsync(IPAddress.Loopback, port);
            Assert.IsTrue(this.tcpClient.Connected);
        }

        [TestMethod]
        public async Task AcceptClientAsyncShouldWaitForClientConnection()
        {
            var clientConnected = false;
            var waitEvent = new ManualResetEvent(false);
            var port = this.communicationManager.HostServer(new IPEndPoint(IPAddress.Loopback, 0)).Port;

            var acceptClientTask = this.communicationManager.AcceptClientAsync().ContinueWith(
                (continuationTask, state) =>
                {
                    clientConnected = true;
                    waitEvent.Set();
                },
                null);

            await this.tcpClient.ConnectAsync(IPAddress.Loopback, port);
            Assert.IsTrue(this.tcpClient.Connected);
            Assert.IsTrue(waitEvent.WaitOne(1000) && clientConnected);
        }

        [TestMethod]
        public async Task WaitForClientConnectionShouldWaitUntilClientIsConnected()
        {
            var port = this.communicationManager.HostServer(new IPEndPoint(IPAddress.Loopback, 0)).Port;
            var acceptClientTask = this.communicationManager.AcceptClientAsync();
            await this.tcpClient.ConnectAsync(IPAddress.Loopback, port);

            var clientConnected = this.communicationManager.WaitForClientConnection(1000);

            Assert.IsTrue(this.tcpClient.Connected);
            Assert.IsTrue(clientConnected);
        }

        [TestMethod]
        public void WaitForClientConnectionShouldReturnFalseIfClientIsNotConnected()
        {
            this.communicationManager.HostServer(new IPEndPoint(IPAddress.Loopback, 0));
            var acceptClientTask = this.communicationManager.AcceptClientAsync();

            // Do not attempt the client to connect to server. Directly wait until timeout.
            var clientConnected = this.communicationManager.WaitForClientConnection(100);

            Assert.IsFalse(clientConnected);
        }

        [TestMethod]
        public void StopServerShouldCloseServer()
        {
            var port = this.communicationManager.HostServer(new IPEndPoint(IPAddress.Loopback, 0)).Port;
            var acceptClientTask = this.communicationManager.AcceptClientAsync();

            this.communicationManager.StopServer();

            Assert.ThrowsException<AggregateException>(() => this.tcpClient.ConnectAsync(IPAddress.Loopback, port).Wait());
        }

        #endregion

        private static void SendData(CommunicationChannel communicationManager)
        {
            // Having less than the buffer size in SocketConstants.BUFFERSIZE.
            var dataBytes = new byte[2048];
            for (int i = 0; i < dataBytes.Length; i++)
            {
                dataBytes[i] = 0x65;
            }

            var dataBytesStr = Encoding.UTF8.GetString(dataBytes);

            for (int i = 0; i < 5; i++)
            {
                communicationManager.SendMessage(dataBytesStr);
            }
        }

        private int StartServer()
        {
            this.tcpListener.Start();

            return ((IPEndPoint)this.tcpListener.LocalEndpoint).Port;
        }
        

        private void WriteOnSocket(Socket socket)
        {
            for (int i = 0; i < 10; i++)
            {
                socket.Send(new byte[2] { 0x1, 0x0 });
            }
        }

        private string ReadFromStream(Stream stream)
        {
            using (var reader = new BinaryReader(stream, Encoding.UTF8, true))
            {
                return reader.ReadString();
            }
        }

        private void WriteToStream(Stream stream, string data)
        {
            using (var writer = new BinaryWriter(stream, Encoding.UTF8, true))
            {
                writer.Write(data);
                writer.Flush();
            }
        }
    }
}
