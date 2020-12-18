import { Player } from "../Structures/Player";


export function findMissingPlayers(map1: Map<number, Player>, map2: Map<number, Player>) : Array<Player> {
    const res = [];
    for (const [key, player] of map1) {
        if (!map2.has(key)) res.push(player);
    }
    return res;
}