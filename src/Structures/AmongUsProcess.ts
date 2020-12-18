
import * as MemoryJS from "memoryjs";
import {AMONG_US_STATES, MEETING_STATES, PROCESS_EVENT} from "../util/Constants";
import {AddressData} from "../util/AmongUsAddressData";
import * as path from "path";
import * as fs from "fs";
import { Game } from "./Game";
import {EventEmitter} from "events";
import { Player, PlayerBaseInfo } from "./Player";

export type ScanCallback = (pc: AmongUsProcess) => void

export interface AmongUsProcessSettings {
    playerEvents?: boolean
    playerEventInterval?: number
    gameEventInterval: number
    gameVersion: string
}

const defaultSettings: AmongUsProcessSettings = {
    gameEventInterval: 750,
    playerEventInterval: 250,
    gameVersion: "2020.12.9"
};

export class AmongUsProcess extends EventEmitter {
    process: MemoryJS.ProcessObject
    asm: MemoryJS.ModuleObject
    addresses: AddressData
    settings: AmongUsProcessSettings
    game?: Game

    constructor(settings: Partial<AmongUsProcessSettings>, process: MemoryJS.ProcessObject, asm: MemoryJS.ModuleObject) {
        super();
        this.settings = Object.assign(defaultSettings, settings);
        this.process = process;
        this.asm = asm;
        this.addresses = require(`../../data/${this.settings.gameVersion}.json`);

        let playerInterval = 0;
        let lastMeetingState = -1;
        const interval = setInterval(() => {
            // Step 1: Check if the among us process that is connected to this instance has been closed
            if (!MemoryJS.getProcesses().some(p => p.th32ProcessID === this.process.th32ProcessID)) {
                this.emit("close", this);
                clearInterval(interval);
                clearInterval(playerInterval);
                return;
            }

            // Step 2: Get the game state 
            const {state, meetingHudState} = this.getState();
            // If the player is in the menu but there is a game object
            if (state === AMONG_US_STATES.MENU && this.game) {
                // If the game has started, also emit the endGame event.
                if (this.game.started) this.emit("endGame", this.game, false);
                this.emit("leaveGame", this.game);
                delete this.game;
            } 
            else if (state === AMONG_US_STATES.LOBBY && !this.game) {
                this.game = new Game(this);
                // Without the timeout, if you get game settings inside the event, they will be from the previous game. 
                setTimeout(() => this.emit("joinGame", this.game), 500);
            }

            // Step 3: If the current game state is TASKS, and game.started = false, make game.started = true
            else if (this.game && state === AMONG_US_STATES.TASKS && !this.game.started) {
                this.game.started = true;
                this.emit("startGame", this.game);
            }

            // Step 4: If the current game state is LOBBY
            else if (this.game && state === AMONG_US_STATES.LOBBY && this.game.started) {
                this.emit("endGame", this.game, true);
                this.game.started = false;
            }

            // Step 5: If the current meeting state is not the same as the last one
            if (this.game && meetingHudState !== lastMeetingState) {
                this.game.meetingState = meetingHudState;
                switch (meetingHudState) {
                case MEETING_STATES.DISCUSSION:
                    this.emit("meetingDiscussion", this.game);
                    break;
                case MEETING_STATES.VOTING:
                    this.emit("meetingVoting", this.game);
                    break;
                case MEETING_STATES.RESULTS: 
                    this.emit("meetingResults", this.game);
                }
                lastMeetingState = meetingHudState;
            }
        }, this.settings.gameEventInterval);


        // If the player events setting is enabled
        if (settings.playerEvents) {
            playerInterval = setInterval(() => {
                if (!this.game) return;
                if (!this.game.started) {
                    const previous = new Map(this.game.players);
                    // eslint-disable-next-line prefer-const
                    let {count, firstPlayerAddress} = this.game.players.fetchPlayerArray();
                    for (let i=0; i < count; i++) {
                        const playerClass = this.game.players.get(i);
                        if (!playerClass) {
                            const player = this.game.players.add(firstPlayerAddress);
                            if (player) this.emit("playerJoinLobby", player);
                        } else {
                            playerClass.fetchData(firstPlayerAddress);
                            previous.delete(i);
                        }
                        firstPlayerAddress += 4;
                    }
                    if (previous.size) {
                        for (const [id, leftPlayer] of previous) {
                            this.game.players.delete(id);
                            this.emit("playerLeaveLobby", leftPlayer);
                        }
                    }
                }
            }, this.settings.playerEventInterval);
        }


    }

    getState() : {meetingHudState: MEETING_STATES, state: AMONG_US_STATES} {
        const meetingHud = this.readMemory<number>("pointer", this.asm.modBaseAddr, this.addresses.meetingHud);
        const meetingHud_cachePtr = meetingHud === 0 ? 0 : this.readMemory<number>("uint32", meetingHud, this.addresses.meetingHudCachePtr);
        const meetingHudState = meetingHud_cachePtr === 0 ? -1 : this.readMemory("int", meetingHud, this.addresses.meetingHudState, 4);
        const state = this.readMemory("int", this.asm.modBaseAddr, this.addresses.game.state);
        switch(state) {
        case 0: return {meetingHudState: meetingHudState, state: AMONG_US_STATES.MENU};
        case 1: 
        case 3:
            return {state: AMONG_US_STATES.LOBBY, meetingHudState: meetingHudState};
        default:
            if (meetingHudState > -1) return {state: AMONG_US_STATES.DISCUSSION, meetingHudState: meetingHudState};
            else return {state: AMONG_US_STATES.TASKS, meetingHudState: meetingHudState};
        }
    }

    static all(settings: Partial<AmongUsProcessSettings> = {}) : Array<AmongUsProcess> {
        const processes = [];
        for (const process of MemoryJS.getProcesses()) {
            if (process.szExeFile === "Among Us.exe") processes.push(new AmongUsProcess(settings, MemoryJS.openProcess("Among Us.exe"), MemoryJS.findModule("GameAssembly.dll", process.th32ProcessID)));
        }
        return processes;
    }

    static scan(cb: ScanCallback, settings: Partial<AmongUsProcessSettings> = {}, interval = 1000, cancelOnFirstFind = true) : void {
        const foundProcesses: Array<number> = [];
        const inv = setInterval(() => {
            const process = MemoryJS.getProcesses().find(p => p.szExeFile === "Among Us.exe");
            if (!process || foundProcesses.includes(process.th32ProcessID)) return;
            // Sometimes, memoryJS won't find the game assembly at game start.
            setTimeout(() => {
                cb(new AmongUsProcess(settings, MemoryJS.openProcess("Among Us.exe"), MemoryJS.findModule("GameAssembly.dll", process.th32ProcessID)));
                foundProcesses.push(process.th32ProcessID);
                if (cancelOnFirstFind) clearInterval(inv);
            }, 750);
        }, interval);
    }

    static getVersion() : string|null {
        const unityAnalytics = path.resolve(`${(process.env.LOCALAPPDATA || "")}Low`, "Innersloth/Among Us/Unity/6b8b0d91-4a20-4a00-a3e4-4da4a883a5f0/Analytics/values");
        if (!fs.existsSync(unityAnalytics)) return null;
        try {
            return JSON.parse(fs.readFileSync(unityAnalytics, "utf-8")).app_ver;
        } catch(err) {
            return null;
        } 
    }

    /*Methods for reading memory. Don't use if you don't know what you're doing!*/

    offsetAddress(address: number, offsets: number[]): number {
        if (!address || !this.process) return 0;
        address = address & 0xffffffff;
        for (let i = 0; i < offsets.length - 1; i++) {
            address = MemoryJS.readMemory<number>(this.process.handle, address + offsets[i], "uint32");
            if (address == 0) break;
        }
        const last = offsets.length > 0 ? offsets[offsets.length - 1] : 0;
        return address + last;
    }

    readMemory<T>(dataType: MemoryJS.DataType, address: number, offsets: number[], defaultParam?: T): T {
        return MemoryJS.readMemory<T>(this.process.handle, this.offsetAddress(address, offsets), dataType) || (defaultParam as T);
    }

    readString(address: number): string {
        const length = MemoryJS.readMemory<number>(this.process.handle, address + 0x8, "int");
        const buffer = MemoryJS.readBuffer(this.process.handle, address + 0xC, length << 1);
        return buffer.toString("utf8").replace(/\0/g, "");
    }


}

export declare interface AmongUsProcess {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    on(event: PROCESS_EVENT, cb: (...args: Array<any>) => void) : this;
    on(event: "joinGame", cb: (game: Game) => void) : this;
    on(event: "startGame", cb: (game: Game) => void) : this;
    on(event: "leaveGame", cb: (game: Game) => void) : this;
    on(event: "endGame", cb: (game: Game) => void) : this;
    on(event: "meetingDiscussion", cb: (game: Game) => void) : this;
    on(event: "meetingVoting", cb: (game: Game) => void) : this;
    on(event: "meetingResults", cb: (game: Game) => void) : this;
    on(event: "playerJoinLobby", cb: (player: Player) => void) : this;
    on(event: "playerLeaveLobby", cb: (player: PlayerBaseInfo) => void) : this;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    emit(event: PROCESS_EVENT, ...data: Array<any>) : boolean;
}