export default function (url, cb) {
    var sessionId = null;
    var heartbeatTimer = null;
    var callback = cb;

    const message = (c, p) => {
        return {
            sessionId: sessionId,
            command: c,
            payload: p,
            text: () => sessionId + "\u001E" + c + "\u001E" + p
        }
    }

    const messageHandler = m => {
        console.log("in: " + m);
        var parts = m.split("\u001E");
        var sid = parts[0];
        var command = parts[1];
        var payload = parts[2];

        if (sessionId != sid) {
            sessionId = sid;
        }

        callback({
            sessionId: sid,
            command: command,
            payload: payload
        })
    }

    const newSocket = () => {
        var ws = new WebSocket(url);
        ws.onopen = (e) => {
            heartbeatTimer = setInterval(() => getSocket().send(message("PING", Date.now()).text()), 5000);
        }
        ws.onclose = (e) => {
            callback(message("CLIENT_ERROR", "Disconnected from server (" + e.code + " - " + e.reason + ")"));
            clearInterval(heartbeatTimer);
        }
        ws.onerror = (e) => {
            callback(message("CLIENT_ERROR", "Error (" + JSON.stringify(e) + ")"));
        }
        ws.onmessage = (e) => {
            messageHandler(e.data);
        }
        return ws;
    }

    var socket = newSocket();

    const getSocket = () => {
        if (socket.readyState != WebSocket.OPEN) {
            callback(message("CLIENT_ERROR", "Socket closed unexpectedly!"));
            socket = newSocket();
        }
        return socket;
    }

    const sendMessage = (c, p) => {
        var m = message(c, p).text();
        console.log("out: " + m);
        getSocket().send(m);
    }

    return {
        login: (t) => sendMessage("LOGIN", t),
        token: (t) => sendMessage("TOKEN", t),
        execute: (t) => sendMessage("EXECUTE", t),
        logout: (t) => sendMessage("LOGOUT", t)
    }

}