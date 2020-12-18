/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */


module.exports = (p)  => {
    console.log("Test case longTasks loaded!");
    p.on("joinGame", (game) => {
        console.log("Test Case: Long Tasks Setting");
        console.log("Get long tasks: ", game.getLongTasks());
        const newLongTasks = Math.floor(Math.random() * 100) - 1;
        game.setLongTasks(newLongTasks);
        console.log("Set long task setting to: ", newLongTasks);
        console.log("\n");
    });

    p.on("meetingDiscussion", (game) => {
        console.log("Test Case: Long Tasks Setting");
        console.log("Get long tasks: ", game.getLongTasks());
    });
};