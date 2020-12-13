import {AmongUsProcess} from "./Structures/AmongUsProcess";

AmongUsProcess.scan((p) => {
    console.log("Connected!");
    setInterval(() => {
        console.log(p.state);
    }, 250);
}, 1000, false);
