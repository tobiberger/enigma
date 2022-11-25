import { EnigmaRotorConfiguration, EnigmaRotorWiring, validateEnigmaRotorConfiguration } from "./EnigmaModel"
import { RotorSetting } from "./EnigmaConfiguration"
import { EnigmaLetter, enigmaLetters, toEnigmaLetter, toNumeric, validateNumericEnigmaLetter } from "./EnigmaLetter"

export class EnigmaRotor {
    private readonly notchIndices: number[]
    private readonly wiring: EnigmaRotorWiring
    private readonly reverseWiring: EnigmaRotorWiring
    private ringOffset: number
    private positionOffset: number

    constructor(configuration: EnigmaRotorConfiguration) {
        validateEnigmaRotorConfiguration(configuration)
        this.notchIndices = configuration.notches.map((notch) => toNumeric(notch))
        this.wiring = configuration.wiring
        this.reverseWiring = reverse(configuration.wiring)
        this.ringOffset = 0
        this.positionOffset = 0
    }

    setRingPosition(ringPosition: RotorSetting) {
        this.ringOffset = numericRotorSetting(ringPosition) - 1
    }

    getPosition(): EnigmaLetter {
        return toEnigmaLetter(this.positionOffset + 1)
    }

    setPosition(position: RotorSetting) {
        this.positionOffset = numericRotorSetting(position) - 1
    }

    rotate(): boolean {
        const shouldRotateNext = this.notchIndices.includes(this.positionOffset)
        this.positionOffset = (this.positionOffset + 1) % enigmaLetters.length
        return shouldRotateNext
    }

    passForward(letter: EnigmaLetter): EnigmaLetter {
        const withOffsets = this.addOffsets(letter)
        const mapped = this.wiring[withOffsets]
        return this.subtractOffsets(mapped)
    }

    passReverse(letter: EnigmaLetter): EnigmaLetter {
        const withOffsets = this.addOffsets(letter)
        const mapped = this.reverseWiring[withOffsets]
        return this.subtractOffsets(mapped)
    }

    private addOffsets(letter: EnigmaLetter): EnigmaLetter {
        const numeric = ((toNumeric(letter) + this.ringOffset + this.positionOffset - 1) % enigmaLetters.length) + 1
        return toEnigmaLetter(numeric)
    }

    private subtractOffsets(letter: EnigmaLetter): EnigmaLetter {
        const numeric = ((toNumeric(letter) - this.ringOffset - this.positionOffset + enigmaLetters.length - 1) % enigmaLetters.length) + 1
        return toEnigmaLetter(numeric)
    }
}

const numericRotorSetting = (rotorSetting: RotorSetting) => {
    const numericValue = typeof rotorSetting === "number" ? rotorSetting : toNumeric(rotorSetting)
    return validateNumericEnigmaLetter(numericValue)
}

const reverse = (wiring: EnigmaRotorWiring) =>
    Object.entries(wiring).reduce((reverseWiring, [key, value]) => {
        reverseWiring[value] = key as EnigmaLetter
        return reverseWiring
    }, {} as EnigmaRotorWiring)
