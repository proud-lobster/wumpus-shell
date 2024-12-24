import Storage from "./Storage.js"
import StateMachine from "./StateMachine.js"
import loadInitialState from "./states.js"

const page = {
    get console() {
        return document.querySelector(".wumpus-console");
    },

    get content() {
        return page.console.querySelector(".content");
    },

    get prompt() {
        return page.console.querySelector(".prompt");
    },

    get input() {
        return page.console.querySelector("input");
    },

    get inputForm() {
        return page.console.querySelector(".input-form");
    }
}

export default class Terminal {

    constructor(
        host = "serve.the.wumpus.online",
        port = "8443",
        path = "socket"
    ) {

        this.sock = new Worker("./socket-worker.js");
        this.storage = new Storage();
        this.machine = new StateMachine(this.write.bind(this), this.refresh.bind(this), this.storage);
        this.sock.onmessage = (e) => this.machine.ondirective(e.data.directive, e.data.payload);
        this.connectUrl = `wss://${host}:${port}/${path}`;

        this.lineWidth = 120;

    }

    refresh() {
        const hud = this.storage.clientHud + ">";
        const limit = this.lineWidth - hud.length - 1;

        page.prompt.innerText = hud;
        page.console.style.width = this.lineWidth + "ch";
        page.input.setAttribute("maxlength", limit);
        page.input.style.width = limit + "ch";

        window.scrollTo(0, document.body.scrollHeight);
        page.input.focus();
    }

    write(t) {
        if (t.includes("\n")) {
            t.split("\n").forEach(l => this.write(l));
        } else {
            const newP = document.createElement("p");
            newP.textContent = t;
            page.content.appendChild(newP);
            this.refresh();
        }
    }

    init() {
        window.addEventListener("click", (e) => {
            if (e.target.nodeName === "HTML" || e.target.nodeName === "BODY") {
                page.input.focus();
            }
        });

        function inputHandler(e) {
            e.preventDefault();
            const v = page.input.value.trim();
            page.input.value = "";
            this.write(this.storage.clientHud + "> " + v);
            if (v.length > 0) {
                this.machine.oninput(v);
            }
            this.refresh();
        }

        page.inputForm.addEventListener("submit", inputHandler.bind(this));
        this.refresh();

        function toSock(d, p) {
            this.sock.postMessage({ directive: d, payload: p });
        }

        this.machine.push(loadInitialState(this.machine, toSock.bind(this), this.connectUrl, this.storage));
    }
}