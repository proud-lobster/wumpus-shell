export default function (url, callback) {

    const newSocket = () => {
        var ws = new WebSocket(url);
        ws.onmessage = (e) => {
            callback(e.data);
        }
        return ws;
    }

    var socket = newSocket();

    const getSocket = () => {
        if (socket.readyState != WebSocket.OPEN) {
            socket = newSocket();
        }
        return socket;
    }

    const $ = {
        send: (t) => {
            getSocket().send(t);
        }
    };

    return $;
}