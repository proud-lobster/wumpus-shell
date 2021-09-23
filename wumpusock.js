export default function (url, writer, cb) {

    var sessionId = null;
    var callback = cb;

    const sockout = t => {
        writer("WUMPUSOCK: " + t);
    }

    const goCallback = (c, s) => {
        callback(c, s);
        callback = cb;
    }

    const messageHandler = m => {
        var parts = m.split("|");
        var type = parts[0];
        var sid = parts[1];
        var content = parts[2];

        switch (type) {
            case "SUCCESS":
                if (sessionId != sid) {
                    sessionId = sid;
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
            getSocket().send("COMMAND|" + sessionId + "|" + t);
        },
        auth: (u,p,c) => {
            getSocket().send("LOG_IN|" + sessionId + "|" + u + " " + p);
            callback = c;
        },
        newUser: (u,p,c) => {
            getSocket().send("CREATE_PLAYER|" + sessionId + "|" + u + " " + p);
            callback = c;
        }
    };

    return $;
}