/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */


module.exports = (p)  => {
    let interval;
    p.on("startGame", (game) => {
        console.log("Game started!");
        interval = setInterval(() => {
            const players = [];
            for (const [, player] of game.players) {
                player.patch();
                players.push(`ID: ${player.id} | Name: ${player.name} | Is Impostor: ${player.isImpostor} | Is Dead: ${player.isDead} | Is Disconnected: ${player.disconnected} | X: ${player.x} | Y: ${player.y}`);
            }
            console.log(players.join("\n") || "No players?");
            console.log("----------------------------------------------------------------------------------------------");
        }, 10000);
    });

    p.on("endGame", () => {
        clearInterval(interval);
    });
};