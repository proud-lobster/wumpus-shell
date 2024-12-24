export default class Storage {
    constructor() {
        return new Proxy(localStorage, {
            get(target, prop) {
                return target.getItem("wumpush." + prop);
            },
            set(target, prop, value) {
                target.setItem("wumpush." + prop, value);
                return true;
            },
            deleteProperty(target, prop) {
                target.removeItem("wumpush." + prop);
                return true;
            }
        });
    }
}