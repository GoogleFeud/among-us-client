import { Game } from "../Structures/Game";
import { Player } from "../Structures/Player";

export type PlayerCollectorFilter = (player: Player) => boolean

export class PlayerCollector extends Map<number, Player> {
    game: Game
    constructor(game: Game) {
        super();
        this.game = game;
        this.fetch();
    }

    /** Add a new player by providing a pointer to a player class. This method is used internally. */
    add(address: number) : Player|null {
        const buffer = Player.getPlayerBuffer(this.game.process, address);
        if (!buffer) return null;
        const player = new Player(this.game, buffer);
        if (player.id === undefined || (player.id > 10 || player.id < 0)) return null;
        this.set(player.id || 0, player);
        return player;
    }

    /** Fetches all players and **clears** the map. */
    fetch() : void {
        this.clear();
        // eslint-disable-next-line prefer-const
        let {count, firstPlayerAddress} = this.fetchPlayerArray();

        for (let i=0; i < count; i++) {
            const player = new Player(this.game, firstPlayerAddress);
            if (player.id === undefined || (player.id > 10 || player.id < 0)) return;
            firstPlayerAddress += 4;
            this.set(i, player);
        }
    }

    /** Returns the address of the first player in the player array, and the length of the array. */
    fetchPlayerArray() : {count: number, firstPlayerAddress: number} {
        const process = this.game.process;
        const ptrToPlayerListStructure = process.readMemory<number>("ptr", process.asm.modBaseAddr, process.addresses.player.allPlayersPtr);
        const allPlayersArray = process.readMemory<number>("ptr", ptrToPlayerListStructure, process.addresses.player.allPlayers);
        return {
            count: process.readMemory<number>("int", ptrToPlayerListStructure, process.addresses.player.count),
            firstPlayerAddress: allPlayersArray + process.addresses.player.addrPtr
        };
    } 

    //--- Some nice utility methods

    /** Filters all players in the map. Similar to [Array#map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map) */
    filter(cb: PlayerCollectorFilter) : Array<Player> {
        const res = [];
        for (const [, player] of this) {
            if (cb(player)) res.push(player);
        }
        return res;
    }

}