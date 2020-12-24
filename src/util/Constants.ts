
export enum AMONG_US_STATES {
    LOBBY,
    TASKS,
    DISCUSSION,
    MENU,
    VOTING,
    RESULTS,
    UNKNOWN
}

export enum PLAYER_COLORS {
    Red,
    Blue,
    DarkGreen,
    Pink,
    Orange,
    Yellow,
    Black,
    White,
    Purple,
    Brown,
    Cyan,
    Lime
}

export type PROCESS_EVENT = "close" | "endGame" | "leaveGame" | "joinGame" | "startGame"  | "playerDie" | "playerDisconnect" | "playerEject" | "tasks" | "discussion" | "results" | "voting"