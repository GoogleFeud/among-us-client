# among-us-client

Get and modify data from a local among us game. This library was **NOT** made so you can cheat in public lobbies. That's for losers. 

**This library is NOWHERRE near complete. There are a few known bugs such as the code of a game sometimes being undefined**

## Example

```js
const AmongUsProcess = require("among-us-client");

// Calls the callback function when an among us process is found
AmongUsProcess.scan((p) => {
    console.log("Connected!");
    

    // Calls the callback when the user joins a game
    p.on("joinGame", (game) => {
        console.log("Game joined: ", game.code);
        // Sets the lobby's "Player Speed" setting to 10. Works only if the player is the lobby host.
        game.setPlayerSpeed(10);

    });

    // Calls the callback when the user leaves a game
    p.on("leaveGame", (game) => {
        console.log("Game left: ", game.code);
    });

    // Calls the callback when the user disconnects
    p.on("close", () => {
        console.log("Process closed!");
    });

    // When the game starts
    p.on("startGame", (game) => {

    });
});

```

Some other useful events and methods:
```
endGame
meetingDiscussion
meetingVoting
meetingResults
game.getTotalTasks()
game.getCompletedTasks()
game.getPlayerSpeed()
```

## Plans

- Player info - impostors, in vents, on cameras, positions.
- Change color
- Change other game settings
- Change name
- Change speed in game
- Report any body of player (even alive)