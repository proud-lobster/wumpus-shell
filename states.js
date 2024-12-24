export default function (machine, toSock, sockAddr, storage) {
    const toOut = machine.toOutput.bind(machine);
    const push = machine.push.bind(machine);

    const states = {
        INITIAL: {
            onenter() {
                toOut("Wumpus Shell 1.0.0-alpha-r1");
                toOut("by Proud Lobster Games");
                toOut("Connecting...");
                toSock("CONNECT", sockAddr);
            },
            onsuccess(p) {
                toOut(p);
                push(states.CHECK);
            }
        },

        CHECK: {
            onenter() {
                toOut("Checking credentials...");
                if (storage.clientEmail && storage.clientToken) {
                    push(states.LOGIN);
                } else {
                    toOut("Enter your email address to log in.  If there is no account associated with the email address then a new one will be created.");
                }
            },
            oninput(i) {
                storage.clientEmail = i;
                storage.clientToken = "";
                push(states.LOGIN);
            }
        },

        LOGIN: {
            onenter() {
                toOut(`Logging in as ${storage.clientEmail}...`);
                toSock("LOGIN", storage.clientEmail + ":" + storage.clientToken);
            },
            onsuccess(p) {
                toOut(p);
                push(states.ACTIVE);
            },
            onfailure(p) {
                toOut(p);
                storage.clientEmail = "";
                storage.clientToken = "";
                push(states.CHECK);
            },
            onprint(p) {
                toOut(p);
                push(states.PASSCODE);
            },
            ontoken(p) {
                storage.clientToken = p;
                push(states.CHECK);
            }
        },

        PASSCODE: {
            oninput(i) {
                toSock("TOKEN", storage.clientEmail + ":" + i);
            },
            onfailure(p) {
                toOut(p);
                storage.clientEmail = "";
                storage.clientToken = "";
                push(states.CHECK);
            },
            onprint(p) {
                toOut(p);
                push(states.PASSCODE);
            },
            ontoken(p) {
                storage.clientToken = p;
                push(states.CHECK);
            }
        },

        ACTIVE: {
            oninput(i) {
                toSock("EXECUTE", i);
            }
        }
    }

    return states.INITIAL;
}