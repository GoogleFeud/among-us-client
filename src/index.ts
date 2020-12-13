import {AmongUsProcess} from "./Structures/AmongUsProcess";
import { Game } from "./Structures/Game";


AmongUsProcess.scan((p) => {
    console.log("Connected!");
    
    p.on("joinGame", (game: Game) => {
        console.log("Game joined: ", game.code);
        console.log(game.getPlayerSpeed());
    });

    p.on("leaveGame", (game: Game) => {
        console.log("Game left: ", game.code);
    });

    p.on("close", () => {
        console.log("Process closed!");
    });
}, 1000, true);

