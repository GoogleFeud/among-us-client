
import * as MemoryJS from "memoryjs";
import {AMONG_US_STATES, PROCESS_EVENT} from "./util/Constants";
import {AddressData} from "./util/AmongUsAddressData";
import * as path from "path";
import * as fs from "fs";
import { Game } from "./Structures/Game";
import {EventEmitter} from "events";
import { Player } from "./Structures/Player";

export type ScanCallback = (pc: AmongUsProcess) => void

export interface AmongUsProcessSettings {
    /** If this is set to false, player objects won't automatically update and you won't receive events such as [[playerDie]], [[playerEject]], and [[playerDisconnect]]. 
     * If you want performance, and don't need player data to be up-to-date, then you can disable this option and update the players where you need to using [[Player.patch]]. 
     */
    playerEvents?: boolean
    /**
     * How often players update in milliseconds.
     */
    playerEventInterval?: number
    gameEventInterval: number
    /**
     * How long the results phase should last. In the actual game is lasts around 5 seconds.
     */
    resultsTimeout: number
    /**
     * Among us version 
     */
    gameVersion: string
}

const defaultSettings: AmongUsProcessSettings = {
    gameEventInterval: 750,
    playerEvents: true,
    playerEventInterval: 750,
    gameVersion: "2020.12.9",
    resultsTimeout: 15000
};


export class AmongUsProcess extends EventEmitter {
    process: MemoryJS.ProcessObject
    asm: MemoryJS.ModuleObject
    addresses: AddressData
    settings: AmongUsProcessSettings
    game?: Game

    cachedState: number

    private meetingHudResults?: boolean

    constructor(settings: Partial<AmongUsProcessSettings>, process: MemoryJS.ProcessObject, asm: MemoryJS.ModuleObject) {
        super();
        this.settings = Object.assign(defaultSettings, settings);
        this.process = process;
        this.asm = asm;
        this.addresses = require(`../../data/${this.settings.gameVersion}.json`);

        let playerInterval = -1;

        this.cachedState = -99;
    
        const interval = setInterval(() => {
            // Step 1: Check if the among us process that is connected to this instance has been closed
            if (!MemoryJS.getProcesses().some(p => p.th32ProcessID === this.process.th32ProcessID)) {
                this.emit("close", this);
                clearInterval(interval);
                clearInterval(playerInterval);
                return;
            }
            // Step 2: Get the game state 

            const state = this.getState();
    
            if (this.game) {

                // If the player is in the menu but there is a game object
                if (state === AMONG_US_STATES.MENU) {
                    // If the game has started, also emit the endGame event.
                    if (this.game.started) this.emit("endGame", this.game, false);
                    this.emit("leaveGame", this.game);
                    delete this.game;
                } 

                // Step 3: If the current game state is TASKS, and game.started = false, make game.started = true
                else if (state === AMONG_US_STATES.TASKS && !this.game.started) {
                    this.game.started = true;
                    this.emit("startGame", this.game);
                    this.emit("tasks", this);
                }

                // Step 4: If the current game state is LOBBY
                else if (state === AMONG_US_STATES.LOBBY && this.game.started) {
                    this.emit("endGame", this.game, true);
                    this.game.started = false;
                }

                else if (state !== this.cachedState && (this.game as Game).started) {
                    switch (state) {
                    case AMONG_US_STATES.TASKS:
                        this.emit("tasks", this);
                        break;
                    case AMONG_US_STATES.DISCUSSION:
                        this.emit("discussion", this);
                        break;
                    case AMONG_US_STATES.RESULTS:
                        this.emit("results", this);
                        break;
                    case AMONG_US_STATES.VOTING:
                        this.emit("voting", this);
                        break;
                    }
                }

            } 
            else if (state === AMONG_US_STATES.LOBBY) {
                this.game = new Game(this);
                this.emit("joinGame", this.game);
            }

            this.cachedState = state;
        }, this.settings.gameEventInterval);


        // If the player events setting is enabled
        if (settings.playerEvents) {
            playerInterval = setInterval(() => {
                if (!this.game) return;
                if (this.game.started) {
                    // Fetch the data for each player again
                    // eslint-disable-next-line prefer-const
                    let {count, firstPlayerAddress} = this.game.players.fetchPlayerArray();
                    for (let i=0; i < count; i++) {
                        const player = this.game.players.get(i);
                        if (!player) this.game.players.add(firstPlayerAddress);
                        else player.fetchData(firstPlayerAddress);
                        firstPlayerAddress += 4;
                    }
                } 
            }, this.settings.playerEventInterval); 
        }

    }


    getState() : number {
        const meetingHud = this.readMemory<number>("pointer", this.asm.modBaseAddr, this.addresses.meetingHud);
        const meetingHud_cachePtr = meetingHud === 0 ? 0 : this.readMemory<number>("uint32", meetingHud, this.addresses.meetingHudCachePtr);
        const meetingHudState = meetingHud_cachePtr === 0 ? 4 : this.readMemory("int", meetingHud, this.addresses.meetingHudState, 4) as number;
        const state = this.readMemory("int", this.asm.modBaseAddr, this.addresses.game.state);
        let resultTimeout;
        switch(state) {
        case 0: 
        case undefined:
            return AMONG_US_STATES.MENU;
        case 1: 
        case 3:
            return AMONG_US_STATES.LOBBY;
        default:
            // When there are around 15 seconds left for voting - the hud state switches to 2.
            if (meetingHudState === 1 || meetingHudState === 2) return AMONG_US_STATES.VOTING;
            else if (this.game && this.game.started && meetingHudState > 3) {
                this.meetingHudResults = true;
                return AMONG_US_STATES.DISCUSSION;
            } else if (this.meetingHudResults && meetingHudState === 3) {
                if (!resultTimeout) resultTimeout = setTimeout(() => this.meetingHudResults = false, this.settings.resultsTimeout);
                return AMONG_US_STATES.RESULTS;
            }
            else return AMONG_US_STATES.TASKS;
        }
    }


    /** Gets all open among us processes. This should be ran once. */
    static all(settings: Partial<AmongUsProcessSettings> = {}) : Array<AmongUsProcess> {
        const processes = [];
        for (const process of MemoryJS.getProcesses()) {
            if (process.szExeFile === "Among Us.exe") processes.push(new AmongUsProcess(settings, MemoryJS.openProcess("Among Us.exe"), MemoryJS.findModule("GameAssembly.dll", process.th32ProcessID)));
        }
        return processes;
    }

    /** Scan for among us processes. The callback will be executed when a new process is found.
     * 
     * Example:
     * 
     * ```js
     * AmongUsProcess.scan(process => {
     * console.log("Found a new among us process!");
     * console.log(process.game);
     * });
     * ```
     */
    static scan(cb: ScanCallback, settings: Partial<AmongUsProcessSettings> = {}, interval = 1000, cancelOnFirstFind = true) : void {
        const foundProcesses: Array<number> = [];
        const inv = setInterval(() => {
            const process = MemoryJS.getProcesses().find(p => p.szExeFile === "Among Us.exe");
            if (!process || foundProcesses.includes(process.th32ProcessID)) return;
            setTimeout(() => {
                const openedProcess = MemoryJS.openProcess("Among Us.exe");
                let gameAssembly;
                // Attempt to get the GameAssembly module.
                do {
                    try {
                        gameAssembly = MemoryJS.findModule("GameAssembly.dll", process.th32ProcessID);
                    } catch(err) {
                        gameAssembly = undefined;
                    }
                }while(!gameAssembly);
                cb(new AmongUsProcess(settings, openedProcess, gameAssembly));
                foundProcesses.push(process.th32ProcessID);
                if (cancelOnFirstFind) clearInterval(inv);
            }, 750);
        }, interval);
    }


    /** Get the current version of among us that is installed. */
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


/** 
 * Emitted when a player joins an among us game.
 * @asMemberOf AmongUsProcess
 * @event
 */
declare function joinGame(game: Game) : void;

/** 
 * Emitted when the game starts
 * @asMemberOf AmongUsProcess
 * @event
 */
declare function startGame(game: Game) : void;

/** 
 * Emitted when the player leaves a game
 * @asMemberOf AmongUsProcess
 * @event
 */
declare function leaveGame(game: Game) : void;

/**
 * Emitted when a game ends.
 * @param stayedInLobby If the player clicks on the "Play Again" button in the game over screen
 * @asMemberOf AmongUsProcess
 * @event
 */
declare function endGame(game: Game, stayedInLobby: boolean) : void;


/**
 * Emitted when a player dies.
 * @param player The player who died
 * @param killer The impostor which killed the player. The impostor which is the closest to the player is determined to be the killer.
 * @asMemberOf AmongUsProcess
 * @event
 */

declare function playerDie(player: Player, killer?: Player) : void;


/**
 * Emitted when a player gets ejected
 * @asMemberOf AmongUsProcess
 * @event 
 */
declare function playerEject(player: Player) : void;

/**
 * Emitted when any player (dead, alive) disconnects
 * @asMemberOf AmongUsProcess
 * @event 
 */
declare function playerDisconnect(player: Player) : void;

/**
 * Emitted when the discussion phase begins
 * @asMemberOf AmongUsProcess
 * @event 
 */
declare function discussion(game: Game) : void;

/**
 * Emitted when the voting phase begins
 * @asMemberOf AmongUsProcess
 * @event 
 */
declare function voting(game: Game) : void;

/**
 * Emitted when the results phase begins.
 * @asMemberOf AmongUsProcess
 * @event 
 */

declare function results(game: Game) : void;

/**
 * Emitted when the tasks phase begins
 * @asMemberOf AmongUsProcess
 * @event  
 */

declare function tasks(game: Game) : void;

export declare interface AmongUsProcess {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    on(event: PROCESS_EVENT, cb: (...args: Array<any>) => void) : this;

    /** @event joinGame Emitted when the player joins a game */
    on(event: "joinGame", cb: typeof joinGame) : this;
    on(event: "startGame", cb: typeof startGame) : this;
    on(event: "leaveGame", cb: typeof leaveGame) : this;
    on(event: "endGame", cb: typeof endGame) : this;
    on(event: "playerDie", cb: typeof playerDie) : this;
    on(event: "playerEject", cb: typeof playerEject) : this;
    on(event: "playerDisconnect", cb: typeof playerDisconnect) : this;
    on(event: "discussion", cb: typeof discussion) : this;
    on(event: "voting", cb: typeof voting) : this;
    on(event: "results", cb: typeof results) : this;
    on(event: "tasks", cb: typeof tasks) : this;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    emit(event: PROCESS_EVENT, ...data: Array<any>) : boolean;
}