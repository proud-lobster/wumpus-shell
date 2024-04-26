import sockf from './wumpusock.js'

export default function (sockAddr, print) {
    var state = 0;
    var sock = null;

    const NOOP = (e = {}) => { };
    const states = [];

    const clientEmail = () => localStorage.getItem("wumpush.client.email");
    const clientToken = () => localStorage.getItem("wumpush.client.token");

    const defaultServerHandle = e => {
        switch (e.command) {
            case "CLIENT_ERROR":
                print("Client Error: " + e.payload);
                break;
            case "PRINT":
            case "SUCCESS":
                print(e.payload);
                break;
            case "FAILURE":
                print("Server Error: " + e.payload);
                break;
            case "TOKEN":
                localStorage.setItem("wumpush.client.token", e.payload);
                break;
            case "LOGOUT":
                localStorage.setItem("wumpush.client.email", "");
                localStorage.setItem("wumpush.client.token", "");
                print(e.payload);
                push(2);
        }
    }

    const push = s => {
        state = s;
        states[state].enter();
    }
    const inputHandle = e => states[state].inputHandle(e);
    const serverHandle = e => states[state].serverHandle(e);

    /**
     * Initial
     * enter - prints a greeting, opens socket, push 1
     * inputHandle - none
     * serverHandle - default
     */
    states[0] = {
        enter: () => {
            print("Wumpus Shell v.0.0.1-proto-1");
            print("by Proud Lobster Games");
            print("Connecting...");
            sock = sockf(sockAddr, serverHandle);
            push(1);
        },
        inputHandle: NOOP,
        serverHandle: defaultServerHandle
    }

    /**
     * Await Connection
     * enter - none
     * inputHandle - none
     * serverHandle - 
     *      on SUCCESS, push 2
     *      else default
     */
    states[1] = {
        enter: NOOP,
        inputHandle: NOOP,
        serverHandle: e => {
            if (e.command == "SUCCESS") {
                print(e.payload);
                push(2);
            } else {
                defaultServerHandle(e);
            }
        }
    }

    /**
     * Check Credentials
     * enter - 
     *      if email and token available, push 3
     *      else print email prompt
     * inputHandle - set text to email, push 3
     * serverHandle - default
     */
    states[2] = {
        enter: () => {
            if (clientEmail() && clientToken()) {
                push(3);
            } else {
                print("Enter your email address to log in.  If there is no account associated with the email address then a new one will be created.");
            }
        },
        inputHandle: e => {
            // TODO validate email format?
            localStorage.setItem("wumpush.client.email", e);
            localStorage.setItem("wumpush.client.token", "");
            push(3);
        },
        serverHandle: defaultServerHandle
    }

    /**
     * Send Login
     * enter - send login with email and token
     * inputHandle - none
     * serverHandle - 
     *      on SUCCESS, push 5
     *      on FAILURE, reset email and token, push 2
     *      on PRINT, push 4
     *      on TOKEN, set token, push 2
     *      else default
     */
    states[3] = {
        enter: () => {
            sock.login(clientEmail() + ":" + clientToken());
        },
        inputHandle: NOOP,
        serverHandle: e => {
            switch (e.command) {
                case "SUCCESS":
                    print(e.payload);
                    push(5);
                    break;
                case "FAILURE":
                    localStorage.setItem("wumpush.client.email", "");
                    localStorage.setItem("wumpush.client.token", "");
                    print(e.payload);
                    push(2);
                    break;
                case "PRINT":
                    print(e.payload);
                    push(4);
                    break;
                case "TOKEN":
                    localStorage.setItem("wumpush.client.token", e.payload);
                    push(2);
                default:
                    defaultServerHandle(e);
            }
        }
    }

    /**
     * Passcode Prompt
     * enter - none
     * inputHandle - send token with email and passcode input, push 3
     * serverHandle - default
     */
    states[4] = {
        enter: NOOP,
        inputHandle: e => sock.token(clientEmail() + ":" + e),
        serverHandle: e => {
            switch (e.command) {
                case "FAILURE":
                    localStorage.setItem("wumpush.client.email", "");
                    localStorage.setItem("wumpush.client.token", "");
                    print(e.payload);
                    push(2);
                    break;
                case "PRINT":
                    print(e.payload);
                    push(4);
                    break;
                case "TOKEN":
                    localStorage.setItem("wumpush.client.token", e.payload);
                    push(2);
                default:
                    defaultServerHandle(e);
            }
        }
    }

    /**
     * Active
     * enter - none
     * inputHandle - send execute input
     */
    states[5] = {
        enter: NOOP,
        inputHandle: e => sock.execute(e),
        serverHandle: defaultServerHandle
    }

    /**
     * Logout
     * enter - send logout
     * inputHandle - none
     * serverHandle -
     *      on SUCCESS, reset email and token, push 2
     *      else default
     */
    states[6] = {
        enter: () => sock.logout(),
        inputHandle: NOOP,
        serverHandle: e => {
            if (e.command == "SUCCESS") {
                localStorage.setItem("wumpush.client.email", "");
                localStorage.setItem("wumpush.client.token", "");
                print(e.payload);
                push(2);
            } else {
                defaultServerHandle(e);
            }
        }
    }

    return {
        init: () => push(0),
        close: () => push(6),
        input: inputHandle
    }
}