import statef from './wumpustate.js'

export default function (id, h, p, a) {

    const host = h ? h : "serve.the.wumpus.online";
    const port = p ? p : "8443";
    const path = a ? a : "socket";
    
    const term = () => document.querySelector("#" + id + ".wumpus-console");
    const lines = () => term().querySelector(".lines");
    const prompt = () => term().querySelector(".prompt");
    const input = () => term().querySelector("input");

    const refresh = () => {
        prompt().innerText = $.vars.promptBuffer;
    }

    const write = (t) => {
        if (t.includes("\n")) {
            t.split("\n").forEach(l => write(l));
        } else {
            const newP = document.createElement("p");
            newP.textContent = t;
            lines().appendChild(newP);
        }
        refresh();
    };

    const setLineWidth = (w) => {
        refresh();
        term().style.width = w + "ch";
        const l = prompt().innerText.length;
        input().setAttribute("maxlength", w - l);
        input().style.width = (w - l) + "ch";
    }

    var state = statef("wss://" + host + ":" + port + "/" + path, write);

    const inputHandler = (e) => {
        var v = input().value.trim();
        e.preventDefault();
        input().value = "";
        write("> " + v);
        if (v.length > 0) {
            state.input(v);
        }
        window.scrollTo(0, document.body.scrollHeight);
    };

    const clickFocusHandler = (e) => {
        if (e.target.nodeName === "HTML" || e.target.nodeName === "BODY") {
            input().focus();
        }
    }

    const $ = {
        id: id,
        vars: {
            promptBuffer: "> ",
            lineWidth: 80,
            stylesheet: "wumpush.css",
        },
        load: (p = {}) => {
            Object.assign($.vars, p);
            fetch($.vars.stylesheet).then(css => css.text()).then(sh => {
                const style = document.createElement("style");
                style.textContent = sh;
                document.head.appendChild(style);
            });
            window.addEventListener("click", clickFocusHandler);
            term().querySelector(".input-form").addEventListener("submit", inputHandler);
            setLineWidth($.vars.lineWidth);
            state.init();
            input().focus();
        }
    };

    return $;
}