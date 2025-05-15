import { BrowserWindow } from 'electron';
import { createServer, Server, request, ClientRequest } from 'http';
import internal from 'stream';
import { checkConnectionToHost } from 'utils/misc';
import { LocalSyncMode, WsRequest, WsServerMethods } from 'utils/types';

export default class LocalWsServer {
  port = 1806;
  server?: Server;
  request?: ClientRequest;
  syncMode?: LocalSyncMode;
  mainWindow?: BrowserWindow | null = null;
  socket?: internal.Duplex;
  authToken?: string;

  start(syncMode: LocalSyncMode, authToken: string, host?: string) {
    this.syncMode = syncMode;
    this.authToken = authToken;

    if (syncMode === 'Server') {
      this.runServerMode();
      return;
    }

    this.runClientMode(authToken, host);
  }

  stop() {
    if (this.syncMode === 'Server' && this.server) {
      this.server.close(() => {
        console.log('server killed');
      });
    }
  }

  runServerMode() {
    this.server = createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('okay');
    });

    this.server.on('upgrade', (req, socket, head) => {
      const id = Date.now();
      const headers = [
        'HTTP/1.1 101 Web Socket Protocol Handshake',
        'Upgrade: WebSocket',
        'Connection: Upgrade',
        '',
      ]
        .map((line) => line.concat('\r\n'))
        .join('');

      socket.write(headers);

      socket.on('data', (data: Buffer) => {
        const request = JSON.parse(data.toString()) as WsRequest;
        console.log('res', request);
        // socket.write(`replying ${data.toString()} ${new Date().toISOString()}`);
        this.sendServerResponse(socket, request);
      });

      socket.on('end', (_) => {
        console.log(`${id} disconnected!`);
      });
    });

    this.server.listen(this.port, () => console.log('server up at', this.port));
  }

  async runClientMode(authToken: string, host?: string) {
    if (!host) {
      return;
    }

    const isHostUp = await checkConnectionToHost(host);
    console.log('isHhost', isHostUp);
    if (!isHostUp) {
      console.log('HOST Down');
      return;
    }

    try {
      this.request = request({
        port: 1806,
        host: host,
        headers: {
          Connection: 'Upgrade',
          Upgrade: 'websocket',
        },
      });
      this.request.end();

      this.request.on('upgrade', (res, socket, upgradeHead) => {
        this.socket = socket;
        console.log('got upgraded!');

        this.socket.on('data', (data: Buffer) => {
          console.log('client received', data.toString());
        });

        this.sendMessage({
          method: WsServerMethods.PING,
        });

        // keep sending messages
        //   setInterval(() => {
        //     this.socket.write(JSON.stringify({
        //         method: 'ping'
        //     }))
        // }, 1500)
      });
    } catch (error) {
      console.log('err', error);
    }
  }

  sendServerResponse(socket: internal.Duplex, message: WsRequest) {
    switch (message.method) {
      case WsServerMethods.PING:
        const response = { success: true, message: 'Alpha Responding.' };
        return socket.write(JSON.stringify(response));

      default:
        return;
    }
  }

  sendMessage(message: WsRequest) {
    if (!this.socket) {
      return;
    }

    this.socket.write(JSON.stringify(message));
  }
}
