

export interface AddressDataSettings {
    speed: Array<number>
}

export interface GameDataSettings {
    state: Array<number>,
    code: Array<number>,
    tasksTotal: Array<number>,
    tasksCompleted: Array<number>
}

export interface AddressData {
    game: GameDataSettings
    meetingHud: Array<number>,
    meetingHudCachePtr: Array<number>,
    meetingHudState: Array<number>,
    settings: AddressDataSettings
}