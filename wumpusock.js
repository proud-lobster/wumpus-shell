export default function (url, writer, cb) {

    var sessionId = null;
    var heartbeatTimer = null;
    var callback = cb;

    const sockout = t => {
        writer("WUMPUSOCK: " + t);
    }

    const goCallback = (c, s) => {
        callback(c, s);
        callback = cb;
    }

    const heartbeat = () => {
        getSocket().send(sessionId + "\u001EPING\u001E" + Date.now());
    }

    const messageHandler = m => {
        var parts = m.split("\u001E");
        var sid = parts[0];
        var type = parts[1];
        var content = parts[2];

        switch (type) {
            case "SUCCESS":
                if (sessionId != sid) {
                    sessionId = sid;
                    heartbeatTimer = setInterval(heartbeat, 5000);
                }
                goCallback(true, content);
                break;
            case "PRINT":
                writer(content);
                break;
            default:
                sockout("Bad message (" + m + ")");
        }
    }

    const newSocket = () => {
        var ws = new WebSocket(url);
        ws.onopen = (e) => {
            sockout("Connected to server");
        }
        ws.onclose = (e) => {
            sockout("Disconnected from server (" + e.code + " - " + e.reason + ")");
            clearInterval(heartbeatTimer);
        }
        ws.onerror = (e) => {
            sockout("Error (" + JSON.stringify(e) + ")");
        }
        ws.onmessage = (e) => {
            messageHandler(e.data);
        }

        sockout("Connecting to " + url + " ...");
        return ws;
    }

    var socket = newSocket();

    const getSocket = () => {
        if (socket.readyState != WebSocket.OPEN) {
            sockout("Socket closed unexpectedly!");
            socket = newSocket();
        }
        return socket;
    }

    const $ = {
        send: (t) => {
            getSocket().send(sessionId + "\u001ECOMMAND\u001E" + t);
        },
        auth: (u, p, c) => {
            getSocket().send(sessionId + "\u001ELOG_IN\u001E" + u + " " + p);
            callback = c;
        },
        newUser: (u, p, c) => {
            getSocket().send(sessionId + "\u001ECREATE_PLAYER\u001E" + u + " " + p);
            callback = c;
        }
    };

    return $;
}