import { Game } from "./Game";
import Structon from "structron";
import * as MemoryJS from "memoryjs";
import { AmongUsProcess } from "../AmongUsProcess";
import { findClosestPlayer } from "../util/utils";
import { AMONG_US_STATES } from "../util/Constants";

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

export type PlayerResolvable = number|Buffer;

export class Player {
    game: Game
    name?: string
    id?: number
    color?: number
    hat?: number
    pet?: number
    skin?: number
    taskPointer?: number
    isImpostor?: number
    private _isDead?: number
    private _disconnected?: number
    x: number
    y: number
    inVent?: number
    private playerControl?: number;
    constructor(game: Game, playerPointer: PlayerResolvable) {
        this.game = game;
        this.fetchData(playerPointer);
        this.x = 0;
        this.y = 0;
    }

    get isDead() : number|undefined {
        return this._isDead;
    }

    set isDead(val: number|undefined) {
        if (!this.game.started || !this.game.process.settings.playerEvents || val === this._isDead) this._isDead = val;
        else {
            if (val === 1) {
                if (this.game.process.cachedState === AMONG_US_STATES.RESULTS) this.game.process.emit("playerEject", this);
                else this.game.process.emit("playerDie", this, findClosestPlayer(this, this.game.players.filter(p => p.id !== this.id && p.isImpostor === 1 && !p.isDead && !p.disconnected))); 
            }
            this._isDead = val;
        }
    }

    get disconnected() : number|undefined {
        return this._disconnected;
    }

    set disconnected(val: number|undefined) {
        if (!this.game.started || !this.game.process.settings.playerEvents || val === this._disconnected) this._disconnected = val;
        else {
            if (val === 1) this.game.process.emit("playerDisconnect", this);
            this._disconnected = val;
        }
    }

    fetchData(playerPointer: PlayerResolvable) : this {
        const process = this.game.process;
        let buffer;
        if (playerPointer instanceof Buffer) buffer = playerPointer;
        else buffer = MemoryJS.readBuffer(
            process.process.handle, 
            process.offsetAddress(playerPointer, process.addresses.player.offsets),
            process.addresses.player.bufferLength
        );
        const {data} = PlayerStructure.report(buffer, 0, {monitorUsage: false});
        this.name = process.readString(data.name);
        delete data.name;
        Object.assign(this, data);
        this.playerControl = data.objectPointer;
        
        this.inVent = process.readMemory<number>("byte", data.objectPointer, process.addresses.player.inVent);

        const areCoordsLocal = process.readMemory<number>("int", data.objectPointer, process.addresses.player.isLocal, 0);

        const positionOffsets = areCoordsLocal ? [process.addresses.player.localX, process.addresses.player.localY]:[process.addresses.player.remoteX, process.addresses.player.remoteY];
        this.x = process.readMemory<number>("float", data.objectPointer, positionOffsets[0]);
        this.y = process.readMemory<number>("float", data.objectPointer, positionOffsets[1]);
        return this;
    }

    /** Updates player data. Use this method only if you have the [[AmongUsProcessSettings.playerEvents]] option disabled. */
    patch() : void {
        const process = this.game.process;
        const ptrToPlayerListStructure = process.readMemory<number>("ptr", process.asm.modBaseAddr, process.addresses.player.allPlayersPtr);
        const allPlayersArray = process.readMemory<number>("ptr", ptrToPlayerListStructure, process.addresses.player.allPlayers);
        this.fetchData(allPlayersArray + process.addresses.player.addrPtr + ((this.id || 0) * 4));
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