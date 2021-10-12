import sockf from '/wumpusock.js'

export default function (id) {

    var sock = null;
    var inputState = 0;
    var username = null;
    var pwCheck = null;

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

    const connectCallback = () => {
        inputState = 2;
        write("Enter your username, or enter 'NEW' to create a new player.");
    }

    const authCallback = (c, s) => {
        write(s);
        if (c) {
            inputState = 1;
        } else {
            username = null;
            connectCallback();
        }
    }

    const inputHandler = (e) => {
        var v = input().value;
        e.preventDefault();
        input().value = "";
        if (inputState == 1) {
            write(prompt().innerText + v);
            sock.send(v);
        } else if (inputState == 2) { // collect username
            if (v.toUpperCase() === "NEW") {
                inputState = 4;
                write("Enter the new player username.");
            } else {
                username = v;
                inputState = 3;
                // TODO toggle input mask
                write("Enter your password.")
            }
        } else if (inputState == 3) { // collect password
            sock.auth(username, v, authCallback);
            // TODO toggle input mask
        } else if (inputState == 4) { // collect new username
            username = v;
            inputState = 5;
            // TODO toggle input mask
            write("Enter the new player password.");
        } else if (inputState == 5) { // collect new password
            pwCheck = v;
            inputState = 6;
            write("Enter the new password again to confirm.");
        } else if (inputState == 6) { // validate new password
            if (v === pwCheck) {
                sock.newUser(username, v, authCallback);
            } else {
                inputState = 5;
                write("Passwords did not match.");
                write("Enter the new player password.");
            }
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
            greeting: "Wumpus Shell\nby Proud Lobster Games"
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
            input().focus();
            write($.vars.greeting);
            sock = sockf('wss://wumpus.online/', write, connectCallback);
        }
    };

    return $;
}