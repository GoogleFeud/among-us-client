import {AmongUsProcess} from "./Structures/AmongUsProcess";
import { Game } from "./Structures/Game";


AmongUsProcess.scan((p) => {
    console.log("Connected!");
    
    setInterval(() => { //0x1C56C38
        if (!p.game) return;
        console.log("Tasks left: ", p.game.totalTasks() - p.game.completedTasks());
    }, 1000);

    p.on("joinGame", (game: Game) => {
        console.log("Game joined: ", game.code);
        console.log("Player speed: ", game.getPlayerSpeed());
    });

    p.on("leaveGame", (game: Game) => {
        console.log("Game left: ", game.code);
    });

    p.on("close", () => {
        console.log("Process closed!");
    });

    p.on("gameStart", (game: Game) => {
        console.log("Game started", game.code);
    });
}, 1000, true);

