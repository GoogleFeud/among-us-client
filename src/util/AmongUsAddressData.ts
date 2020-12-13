

export interface AddressDataSettings {
    speed: Array<number>
}

export interface AddressData {
    gameState: Array<number>,
    meetingHud: Array<number>,
    meetingHudCachePtr: Array<number>,
    meetingHudState: Array<number>,
    settings: AddressDataSettings
}