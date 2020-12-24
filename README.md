# among-us-client

Get and modify data from a local among us game. This library was **NOT** made so you can cheat in public lobbies. That's for losers. 

**This library is NOWHERE near stable. There are a lot of known bugs and also a ton of missing features. Expect every new commit to contain a breaking change. We're looking for contributors!**

## Install

### Requirements

- Windows
- Latest among us version (2020.12.9)
- Node.js 14+

### Install

**This library will be published to npm when we think it's ready.**  
For now you can:
- Clone or download this repository
- Install all dependencies and dev-dependencies (`npm i`) 
- Transpile the source code to javascript, if you don't use typescript (`tsc`)
- Import the AmongUsProcess where you need it!

## Examples

### Listen to in-game events

```js
const AmongUsProcess = require("among-us-client");

// Scan for an among us process
AmongUsProcess.scan((proc) => {
    console.log("Connected to an among us process!");
    
    proc.on("joinGame", (game) => {
        console.log(`User joined a game with code ${game.code}`);
        // Set the player speed 
        game.setPlayerSpeed(10); // Super super fast!
    });

    proc.on("leaveGame", (game) => {
        console.log(`User left a game with code ${game.code}`);
    });

    proc.on("startGame", (game) => {
        console.log(`Game with code ${game.code} is starting!`);
    });

    proc.on("endGame", (game) => {
        console.log(`Game with code ${game.code} has ended!`);
    });

    proc.on("close", () => {
        console.log("User closed Among Us!");
    });

    proc.on("tasks", (game) => {
        console.log(`There are ${game.getTotalTasks() - game.getCompletedTasks()} tasks left!`);
    });
});

```

### Get all alive impostors

```js
proc.on("startGame", game => {
    console.log(`Impostors: `, game.players.filter(p => p.isImpostor && !p.isDead && !p.disconnected).map(p => p.name));
});
```

### 

## Documentation

Coming soon!
