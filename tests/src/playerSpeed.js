/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */


module.exports = (p)  => {
    p.on("joinGame", (game) => {
        console.log("Test Case: Player Speed Setting");
        console.log("Get player speed: ", game.getPlayerSpeed());
        const newSpeed = 15;
        game.setPlayerSpeed(newSpeed);
        console.log("Set player speed to 15");
        console.log("\n");
    });
};