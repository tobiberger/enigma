import { EnigmaLetter } from "./EnigmaLetter"

export type RotorSetting = number | EnigmaLetter
export type PlugConnection = [EnigmaLetter, EnigmaLetter] | string

export type UnsupportedCharactersBehaviour = "drop" | "keep" | "fail"

export interface EnigmaConfiguration {
    readonly rotorIds: string[]
    readonly ringPositions: RotorSetting[]
    readonly startPositions: RotorSetting[]
    readonly plugConnections: PlugConnection[]
    readonly reflectorId: string
    readonly unsupportedCharacters: UnsupportedCharactersBehaviour
}

export const defaultConfiguration: EnigmaConfiguration = {
    rotorIds: ["I", "II", "III"],
    ringPositions: [1, 1, 1],
    startPositions: ["A", "A", "A"],
    plugConnections: [],
    reflectorId: "UKW_B",
    unsupportedCharacters: "drop",
}
