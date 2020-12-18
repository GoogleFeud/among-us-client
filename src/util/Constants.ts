
export enum AMONG_US_STATES {
    LOBBY,
    TASKS,
    DISCUSSION,
    MENU,
    UNKNOWN
}

export enum MEETING_STATES {
    NO_MEETING = -1,
    DISCUSSION = 0,
    VOTING = 1,
    RESULTS = 3
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

export type PROCESS_EVENT = "close" | "endGame" | "leaveGame" | "joinGame" | "startGame" | "meetingDiscussion" | "meetingVoting" | "meetingResults" | "playerJoinLobby" | "playerLeaveLobby"