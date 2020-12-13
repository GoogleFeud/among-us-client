# among-us-client

Get and modify data from a local among us game. This library was **NOT** made so you can cheat in public lobies. That's for losers. 

## Example

```js
const AmongUsProcess = require("among-us-client");

// Calls the callback function when an among us process if found
AmongUsProcess.scan((p) => {
    console.log("Connected!");
    

    // Calls the callback when the player joins a game
    p.on("joinGame", (game: Game) => {
        console.log("Game joined: ", game.code);
        // Sets the lobby's "Player Speed" setting to 10. Works only if the player is the lobby host.
        game.setPlayerSpeed(10);
    });

    // Calls the callback when a player leaves a game
    p.on("leaveGame", (game: Game) => {
        console.log("Game left: ", game.code);
    });

    // Calls the callback when a player disconnects
    p.on("close", () => {
        console.log("Process closed!");
    });
});


```
