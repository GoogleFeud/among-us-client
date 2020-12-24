/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */


module.exports = (p)  => {
    console.log("Test case gamePlayers loaded!");
    let interval;


    p.on("joinGame", (game) => {
        console.log("Joined game: ", game.code);
        /**   interval = setInterval(() => {
            const players = [];
            for (const [, player] of game.players) {
                players.push(`ID: ${player.id} | Name: ${player.name} | Is Dead: ${player.isDead} | Disconnected: ${player.disconnected} | X: ${Math.round(player.x)}`); 
            }
            console.log(players.join("\n") || "No players?");
            console.log("----------------------------------------------------------------------------------------------"); 
        }, 10000);  */
    }); 

    p.on("startGame", () => {
        console.log("Game started!");
    });

    p.on("leaveGame", () => {
        console.log("Left game!");
        clearInterval(interval);
    });

    p.on("endGame", () => {
        console.log("Game ended!");
    });

    p.on("close", () => {
        console.log("User closed Among us!");
    });

    p.on("playerDie", (player, killer) => {
        console.log(`Player ${player.name} has died! The killer was ${killer ? killer.name:"unknown"}!`);
    });

    p.on("playerDisconnect", (player) => {
        if (!player.isDead) console.log(`Player ${player.name} disconnected!`);
        else console.log(`Player ${player.name} disconnected while they are dead!`);
    });

    p.on("playerEject", (player) => {
        console.log(`${player.name} has been ejected!`);
    });

};