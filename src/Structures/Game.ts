import { AmongUsProcess } from "./AmongUsProcess";
import * as MemoryJS from "memoryjs";
import { AMONG_US_STATES } from "../util/Constants";

export class Game {
    process: AmongUsProcess
    code: string
    started: boolean
    constructor(process: AmongUsProcess) {
        this.process = process;
        this.code = this.process.readString(this.process.readMemory<number>("int32", this.process.asm.modBaseAddr, this.process.addresses.game.code)).split("\r\n")[1];
        const state = process.state;
        if (state === AMONG_US_STATES.TASKS || state === AMONG_US_STATES.DISCUSSION) this.started = true;
        else this.started = false;
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

    totalTasks() : number {
        return this.process.readMemory("int", this.process.asm.modBaseAddr, this.process.addresses.game.tasksTotal, 0);
    }

    completedTasks() : number {
        return this.process.readMemory("int", this.process.asm.modBaseAddr, [0x1C57BE8, 0x5c, 0, 0x2C], 0);
    }

}