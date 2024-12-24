/**
 * This is intended to be initialized as a worker.  Do not import directly.
 */
const delim = "\u001E";
const pingPeriod = 5000;

var sock = null;
var sid = null;

function send(d, p) {
    sock.send(`${sid}${delim}${d}${delim}${p}`);
}

function receive(d, p) {
    self.postMessage({
        directive: d,
        payload: p
    });
}

function connect(url) {
    var heartbeat = null;

    sock = new WebSocket(url);

    sock.onopen = function () {
        const pingSender = () => send("PING", new Date());
        heartbeat = setInterval(pingSender, pingPeriod);
    };

    sock.onclose = function (e) {
        clearInterval(heartbeat);
        receive("FAILURE", `Server Disconnect - ${e.code} - ${e.reason}`);
    }

    sock.onerror = function (e) {
        receive("FAILURE", `Server Error - ${JSON.stringify(e)}`);
    }

    sock.onmessage = function (e) {
        const parts = e.data.split(delim);
        sid = parts[0];
        receive(parts[1], parts[2]);
    }
}

self.onmessage = function (e) {
    const { directive, payload } = e.data;
    if (directive === "CONNECT") {
        connect(payload);
    } else {
        send(directive, payload);
    }
};