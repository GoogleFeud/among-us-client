import { Game } from "./Game";
import Structon from "structron";
import * as MemoryJS from "memoryjs";
import { AmongUsProcess } from "./AmongUsProcess";

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

export interface PlayerBaseInfo {
    name?: string
    id?: number
    color?: number
    hat?: number
    pet?: number
    skin?: number
    x?: number
    y?: number
    ownerId?: number
}

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
    ownerId?: number
    private playerControl?: number;
    constructor(game: Game, playerPointer: number|Buffer) {
        this.game = game;
        this.fetchData(playerPointer);
    }

    fetchData(playerPointer: number|Buffer) : this {
        const process = this.game.process;
        let buffer;
        if (playerPointer instanceof Buffer) buffer = playerPointer;
        else buffer = MemoryJS.readBuffer(
            process.process.handle, 
            process.offsetAddress(playerPointer, process.addresses.player.offsets),
            process.addresses.player.bufferLength
        );
        const {data} = PlayerStructure.report(buffer, 0, {monitorUsage: false});
        const name = process.readString(data.name);
        Object.assign(this, data);
        this.playerControl = data.objectPointer;
        this.name = name;
        
        this.inVent = process.readMemory<number>("byte", data.objectPointer, process.addresses.player.inVent);
        this.ownerId = process.readMemory<number>("uint32", data.objectPointer, process.addresses.player.ownerId);

        const areCoordsLocal = process.readMemory<number>("int", data.objectPointer, process.addresses.player.isLocal, 0);

        const positionOffsets = areCoordsLocal ? [process.addresses.player.localX, process.addresses.player.localY]:[process.addresses.player.remoteX, process.addresses.player.remoteY];
        this.x = process.readMemory<number>("float", data.objectPointer, positionOffsets[0]);
        this.y = process.readMemory<number>("float", data.objectPointer, positionOffsets[1]);
        return this;
    }

    patch() : void {
        const process = this.game.process;
        const ptrToPlayerListStructure = process.readMemory<number>("ptr", process.asm.modBaseAddr, process.addresses.player.allPlayersPtr);
        const allPlayersArray = process.readMemory<number>("ptr", ptrToPlayerListStructure, process.addresses.player.allPlayers);
        this.fetchData(allPlayersArray + process.addresses.player.addrPtr + ((this.id || 0) * 4));
    }

    cloneObject() : PlayerBaseInfo {
        return {
            name: this.name,
            id: this.id,
            color: this.color,
            hat: this.hat,
            pet: this.pet,
            skin: this.skin,
            x: this.x,
            y: this.y,
            ownerId: this.ownerId
        };
    }

    static getPlayerBuffer(process: AmongUsProcess, ptr: number) : Buffer|null {
        const buffer = MemoryJS.readBuffer(
            process.process.handle, 
            process.offsetAddress(ptr, process.addresses.player.offsets),
            process.addresses.player.bufferLength
        );
        if (!PlayerStructure.validate(buffer)) return null;
        return buffer;
    }

}