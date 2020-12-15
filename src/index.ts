import {AmongUsProcess} from "./Structures/AmongUsProcess";
import { Game } from "./Structures/Game";
//import * as MemoryJS from "memoryjs";

AmongUsProcess.scan((p) => {
    console.log("Connected!");


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

    p.on("startGame", (game: Game) => {
        console.log("Game started", game.code);
        const i: NodeJS.Timeout = setInterval(() => { 
            if (!p.game) return clearInterval(i);
            console.log("Tasks left: ", p.game.getTotalTasks() - p.game.getCompletedTasks());
        }, 10000);
    });

    p.on("endGame", (game: Game, stayedInLobby: boolean) => {
        if (!stayedInLobby) return console.log(game.code, "Player left while in game, or left the lobby after the game!");
        console.log("Game ended! GG!");
    });

    p.on("meetingDiscussion", () => {
        console.log("Discussion!");
    });

    p.on("meetingVoting", () => {
        console.log("Meeting voting!");
    });

    p.on("meetingResults", () => {
        console.log("Meeting results!");
    });

}, 1000, true);

