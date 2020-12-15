import { AmongUsProcess } from "./AmongUsProcess";
import * as MemoryJS from "memoryjs";
import { MEETING_STATES } from "../util/Constants";

export class Game {
    process: AmongUsProcess
    code: string
    started: boolean
    meetingState: MEETING_STATES
    constructor(process: AmongUsProcess) {
        this.process = process;
        this.code = this.process.readString(this.process.readMemory<number>("int32", this.process.asm.modBaseAddr, this.process.addresses.game.code)).split("\r\n")[1];
        this.started = false;
        this.meetingState = -1;
    }


    //------ Get and set player speed. ------

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

    //------- Get and set emergency meetings. ------

    getEmergencyMeetings() : number {
        return this.process.readMemory("int", this.process.asm.modBaseAddr, this.process.addresses.settings.emergencyMeetings, 0);
    }

    setEmergencyMeetings(meetings: number) : void {
        MemoryJS.writeMemory(this.process.process.handle, 
            this.process.offsetAddress(this.process.asm.modBaseAddr, this.process.addresses.settings.emergencyMeetings),
            meetings,
            "int"
        );
    }

    //------ Get and set impostor count. ------

    getImpostors() : number {
        return this.process.readMemory("int", this.process.asm.modBaseAddr, this.process.addresses.settings.impostors, 0);
    }

    setImpostors(impostors: number) : void {
        MemoryJS.writeMemory(this.process.process.handle, 
            this.process.offsetAddress(this.process.asm.modBaseAddr, this.process.addresses.settings.impostors),
            impostors,
            "int"
        );
    }

    //------- Get and set the amount of common tasks. ------

    getCommonTasks() : number {
        return this.process.readMemory("int", this.process.asm.modBaseAddr, this.process.addresses.settings.commonTasks, 0);
    }

    setCommonTasks(tasks: number) : void {
        MemoryJS.writeMemory(this.process.process.handle, 
            this.process.offsetAddress(this.process.asm.modBaseAddr, this.process.addresses.settings.commonTasks),
            tasks,
            "int"
        );
    }

    //----- Get total and completed tasks. Total - completed = not completed. -----

    getTotalTasks() : number {
        return this.process.readMemory("int", this.process.asm.modBaseAddr, this.process.addresses.game.tasksTotal, 0);
    }

    getCompletedTasks() : number {
        return this.process.readMemory("int", this.process.asm.modBaseAddr, this.process.addresses.game.tasksCompleted, 0);
    }


}