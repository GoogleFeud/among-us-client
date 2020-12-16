import { Game } from "./Game";
import Structon from "structron";
import * as MemoryJS from "memoryjs";

export const PlayerStructure = new Structon()
    .addMember(Structon.TYPES.SKIP(8), "...")
    .addMember(Structon.TYPES.UINT, "id")
    .addMember(Structon.TYPES.UINT, "name")
    .addMember(Structon.TYPES.UINT, "color")
    .addMember(Structon.TYPES.UINT, "hat")
    .addMember(Structon.TYPES.UINT, "pet")
    .addMember(Structon.TYPES.UINT, "skin")
    .addMember(Structon.TYPES.UINT, "disconnected")
    .addMember(Structon.TYPES.UINT, "taskPointer")
    .addMember(Structon.TYPES.BYTE, "isImpostor")
    .addMember(Structon.TYPES.BYTE, "isDead")
    .addMember(Structon.TYPES.SKIP(2), "...")
    .addMember(Structon.TYPES.UINT, "objectPointer");


export class Player {
    game: Game
    name?: string
    id?: number
    color?: number
    hat?: number
    pet?: number
    skin?: number
    disconnected?: number
    taskPointer?: number
    isImpostor?: number
    isDead?: number
    x?: number
    y?: number
    inVent?: number
    constructor(game: Game, playerPointer: number) {
        this.game = game;
        this.fetchData(playerPointer);
    }

    private fetchData(playerPointer: number) {
        const process = this.game.process;
        const {data} = PlayerStructure.report(MemoryJS.readBuffer(
            process.process.handle, 
            process.offsetAddress(playerPointer, this.game.process.addresses.player.offsets),
            process.addresses.player.bufferLength
        ), 0, {monitorUsage: false});
        data.name = process.readString(data.name);
        Object.assign(this, data);

        this.inVent = process.readMemory<number>("byte", data.objectPointer, process.addresses.player.inVent);

        const areCoordsLocal = process.readMemory<number>("int", data.objectPointer, process.addresses.player.isLocal, 0);

        const positionOffsets = areCoordsLocal ? [process.addresses.player.localX, process.addresses.player.localY]:[process.addresses.player.remoteX, process.addresses.player.remoteY];
        this.x = process.readMemory<number>("float", data.objectPointer, positionOffsets[0]);
        this.y = process.readMemory<number>("float", data.objectPointer, positionOffsets[1]);
    }

    patch() : void {
        const process = this.game.process;
        const ptrToPlayerListStructure = process.readMemory<number>("ptr", process.asm.modBaseAddr, process.addresses.player.allPlayersPtr);
        const allPlayersArray = process.readMemory<number>("ptr", ptrToPlayerListStructure, process.addresses.player.allPlayers);
        this.fetchData(allPlayersArray + process.addresses.player.addrPtr + ((this.id || 0) * 4));
    }

}