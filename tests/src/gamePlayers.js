/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */


module.exports = (p)  => {
    console.log("Test case gamePlayers loaded!");
    let interval;


    p.on("joinGame", (game) => {
        interval = setInterval(() => {
            const players = [];
            for (const [, player] of game.players) {
                players.push(`ID: ${player.id} | Name: ${player.name} | Is Impostor: ${player.isImpostor} | Is Dead: ${player.isDead} | Is Disconnected: ${player.disconnected} | OwnerID: ${player.ownerId} | X: ${Math.round(player.x)}`); 
                if (player.name === "Blue") me = player;
            }
            console.log(players.join("\n") || "No players?");
            console.log("----------------------------------------------------------------------------------------------"); 
        }, 1000); 
    });

    p.on("leaveGame", () => {
        clearInterval(interval);
    });

    p.on("playerJoinLobby", (player) => {
        console.log("Join: ", JSON.stringify({name: player.name, id: player.id}, null, 3));
    });

    p.on("playerLeaveLobby", (player) => {
        console.log("Leave: ", JSON.stringify({name: player.name, id: player.id}, null, 3));
    });

};