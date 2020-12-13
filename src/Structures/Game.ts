import { AmongUsProcess } from "./AmongUsProcess";
import * as MemoryJS from "memoryjs";

export class Game {
    process: AmongUsProcess
    code: string
    constructor(process: AmongUsProcess, codeMem: number) {
        this.process = process;
        this.code = this.process.readString(codeMem).split("\r\n")[1];
    }

    setPlayerSpeed(speed: number) : void {
        MemoryJS.writeMemory(this.process.process.handle, 
            this.process.offsetAddress(this.process.asm.modBaseAddr, this.process.addresses.settings.speed),
            speed,
            "float"
        );
    }

    getPlayerSpeed() : number {
        return this.process.readMemory("float", this.process.asm.modBaseAddr, this.process.addresses.settings.speed, 0);
    }

}