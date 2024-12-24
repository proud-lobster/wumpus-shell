export default class StateMachine {
    constructor(toOuput, refresh, storage) {
        this.state = null;
        this.storage = storage;
        this.refresh = refresh;
        this.toOutput = toOuput;
    }

    push(s) {
        this.state = s;
        if (this.state.onenter) {
            this.state.onenter();
        }
    }

    oninput(i) {
        if (this.state.oninput) {
            this.state.oninput(i);
        }
    }

    ondirective(d, p) {
        console.log(d + " - " + p);
        const handlerName = "on" + d.toLowerCase();
        const handler = this.state[handlerName];
        const runDefault = !handler || handler(p);
        if (runDefault) {
            this[handlerName + "Default"](p);
        }
    }

    onlogoutDefault(p) {
        this.toOutput(p);
        delete this.storage.clientEmail;
        delete this.storage.clientToken;
        this.state = null;
    }

    ontokenDefault(p) {
        this.storage.clientToken = p;
    }

    onsuccessDefault(p) {
        this.toOutput(p);
    }

    onfailureDefault(p) {
        this.toOutput("Server Error: " + p);
    }

    onprintDefault(p) {
        this.toOutput(p);
    }

    onpingDefault(p) {
        this.storage.clientHud = p;
        this.refresh();
    }
}