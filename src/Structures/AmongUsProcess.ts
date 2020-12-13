
import * as MemoryJS from "memoryjs";
import {AMONG_US_STATES} from "../util/Constants";
import {AddressData} from "../util/AmongUsAddressData";
import * as path from "path";
import * as fs from "fs";

export type ScanCallback = (pc: AmongUsProcess) => void

export class AmongUsProcess {
    private process: MemoryJS.ProcessObject
    private asm: MemoryJS.ModuleObject
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    addresses: AddressData

    constructor(process: MemoryJS.ProcessObject, asm: MemoryJS.ModuleObject) {
        this.process = process;
        this.asm = asm;
        this.addresses = require(`../../data/${AmongUsProcess.version}.json`);
    }

    static all() : Array<AmongUsProcess> {
        const processes = [];
        for (const process of MemoryJS.getProcesses()) {
            if (process.szExeFile === "Among Us.exe") processes.push(new AmongUsProcess(MemoryJS.openProcess("Among Us.exe"), MemoryJS.findModule("GameAssembly.dll", process.th32ProcessID)));
        }
        return processes;
    }

    static scan(cb: ScanCallback, interval = 250, cancelOnFirstFind = true) : void {
        const foundProcesses: Array<number> = [];
        const inv = setInterval(() => {
            const process = MemoryJS.getProcesses().find(p => p.szExeFile === "Among Us.exe");
            if (!process || foundProcesses.includes(process.th32ProcessID)) return;
            cb(new AmongUsProcess(MemoryJS.openProcess("Among Us.exe"), MemoryJS.findModule("GameAssembly.dll", process.th32ProcessID)));
            foundProcesses.push(process.th32ProcessID);
            if (cancelOnFirstFind) clearInterval(inv);
        }, interval);
    }

    get state() : number {
        const meetingHud = this.readMemory<number>("pointer", this.asm.modBaseAddr, this.addresses.meetingHud);
        const meetingHud_cachePtr = meetingHud === 0 ? 0 : this.readMemory<number>("uint32", meetingHud, this.addresses.meetingHudCachePtr);
        const meetingHudState = meetingHud_cachePtr === 0 ? 4 : this.readMemory("int", meetingHud, this.addresses.meetingHudState, 4);
        const state = this.readMemory("int", this.asm.modBaseAddr, this.addresses.gameState);
        switch(state) {
        case 0: return AMONG_US_STATES.MENU;
        case 1: 
        case 3:
            return AMONG_US_STATES.LOBBY;
        default:
            if (meetingHudState < 4) return AMONG_US_STATES.DISCUSSION;
            else return AMONG_US_STATES.TASKS;
        }
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

    static version = "2020.12.9";

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
        if (!address || !this.process) return defaultParam as T;
        return MemoryJS.readMemory<T>(this.process.handle, this.offsetAddress(address, offsets), dataType);
    }

    readString(address: number): string {
        const length = MemoryJS.readMemory<number>(this.process.handle, address + 0x8, "int");
        const buffer = MemoryJS.readBuffer(this.process.handle, address + 0xC, length << 1);
        return buffer.toString("utf8").replace(/\0/g, "");
    }

}
