
import { Player } from "../Structures/Player";

export function findClosestPlayer(player: Player, players: Array<Player>) : Player|undefined {
    let closest;
    let smallestDifference = Infinity;

    for (const otherPlayer of players) {
        const x = Math.pow((player.x - otherPlayer.x) + (player.y - otherPlayer.y), 2);
        if (x < smallestDifference) {
            closest = otherPlayer;
            smallestDifference = x;
        } 
    }
    return closest;
}