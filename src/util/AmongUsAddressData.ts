

export interface AddressDataSettings {
    speed: Array<number>,
    emergencyMeetings: Array<number>,
    impostors: Array<number>,
    commonTasks: Array<number>,
    longTasks: Array<number>
}

export interface GameDataSettings {
    state: Array<number>,
    code: Array<number>,
    tasksTotal: Array<number>,
    tasksCompleted: Array<number>,
    exiledPlayerId: Array<number>,
    public: Array<number>
}

export interface PlayerDataSettings {
    allPlayersPtr: Array<number>,
    allPlayers: Array<number>,
    addrPtr: number,
    bufferLength: number,
    offsets: Array<number>,
    count: Array<number>,
    isLocal: Array<number>,
    localX: Array<number>,
    localY: Array<number>,
    remoteX: Array<number>,
    remoteY: Array<number>,
    inVent: Array<number>,
    ownerId: Array<number>
}

export interface AddressData {
    game: GameDataSettings
    meetingHud: Array<number>,
    meetingHudCachePtr: Array<number>,
    meetingHudState: Array<number>,
    settings: AddressDataSettings,
    player: PlayerDataSettings
}
