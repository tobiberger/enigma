import { EnigmaLetter, enigmaLetters } from "./EnigmaLetter"

export class EnigmaModel {
    private readonly rotors: Record<string, EnigmaRotorConfiguration> = {}

    constructor(rotors: Record<string, EnigmaRotorConfiguration | string> = {}) {
        Object.entries(rotors).forEach(([id, rotor]) => this.addRotor(id, rotor))
    }

    addRotor(id: string, rotor: EnigmaRotorConfiguration | string): EnigmaModel {
        if (typeof rotor === "string") {
            this.rotors[id] = parseRotorString(rotor)
        } else {
            this.rotors[id] = validateEnigmaRotorConfiguration(rotor)
        }
        return this
    }

    getRotor(id: string): EnigmaRotorConfiguration {
        const rotor = this.rotors[id]
        if (rotor === undefined) {
            throw Error(`Can't find rotor with id "${id}" in current model configuration. Available rotors are: ${Object.keys(this.rotors)}`)
        }
        return rotor
    }

    static merge(model1: EnigmaModel, model2: EnigmaModel): EnigmaModel {
        return new EnigmaModel({
            ...model1.rotors,
            ...model2.rotors,
        })
    }
}

const parseRotorString = (input: string) => {
    if (!/^[A-Z]{26}(?:_[A-Z]{1,26})?$/.test(input)) {
        throw Error(
            "Invalid Enigma rotor configuration - configuration string must contain exactly 26 uppercase letters, then optionally an underscore and more letters for setting the notches"
        )
    }
    return validateEnigmaRotorConfiguration({
        wiring: enigmaLetters.reduce((rotor, letter, index) => {
            rotor[letter] = input[index] as EnigmaLetter
            return rotor
        }, {} as EnigmaRotorConfiguration["wiring"]),
        notches: [...input.slice(enigmaLetters.length + 1)] as EnigmaLetter[],
    })
}

export type EnigmaRotorWiring = Record<EnigmaLetter, EnigmaLetter>

export interface EnigmaRotorConfiguration {
    wiring: EnigmaRotorWiring
    notches: EnigmaLetter[]
}

export const validateSymmetry = (wiring: EnigmaRotorWiring): EnigmaRotorWiring => {
    enigmaLetters.forEach((letter) => {
        const wiredLetter = wiring[letter]
        const reverse = wiring[wiredLetter]
        if (reverse !== letter) {
            throw Error(`Wiring is not symmetrical - "${letter}" is wired to "${wiredLetter}", but "${wiredLetter}" is wired to "${reverse}"`)
        }
    })
    return wiring
}

export const validateEnigmaRotorConfiguration = (enigmaRotor: EnigmaRotorConfiguration): EnigmaRotorConfiguration => {
    enigmaLetters.forEach((letter) => {
        const mappedLetter = enigmaRotor.wiring[letter]
        if (mappedLetter === undefined) {
            throw Error(`Invalid Enigma rotor configuration - missing wiring for letter ${letter}`)
        }
        if (!enigmaLetters.includes(mappedLetter)) {
            throw Error(`Invalid Enigma rotor configuration - letter ${letter} is wired to invalid value "${mappedLetter}`)
        }
    })
    enigmaRotor.notches.forEach((notch) => {
        if (!enigmaLetters.includes(notch)) {
            throw Error(`Invalid Enigma rotor configuration - notch must be set to a letter, but was "${notch}"`)
        }
    })
    return enigmaRotor
}

export const enigmaRotorAlphabetical: EnigmaRotorConfiguration = parseRotorString("ABCDEFGHIJKLMNOPQRSTUVWXYZ")
export const Enigma_I: EnigmaModel = new EnigmaModel({
    ETW: enigmaRotorAlphabetical,
    UKW_A: "EJMZALYXVBWFCRQUONTSPIKHGD",
    UKW_B: "YRUHQSLDPXNGOKMIEBFZCWVJAT",
    UKW_C: "FVPJIAOYEDRZXWGCTKUQSBNMHL",
    I: "EKMFLGDQVZNTOWYHXUSPAIBRCJ_Q",
    II: "AJDKSIRUXBLHWTMCQGZNPYFVOE_E",
    III: "BDFHJLCPRTXVZNYEIWGAKMUSQO_V",
})
export const Enigma_M3: EnigmaModel = EnigmaModel.merge(
    Enigma_I,
    new EnigmaModel({
        IV: "ESOVPZJAYQUIRHXLNFTGKDCMWB_J",
        V: "VZBRGITYUPSDNHLXAWMJQOFECK_Z",
        VI: "JPGVOUMFYQBENHZRDKASXLICTW_ZM",
        VII: "NZJHGRCXMYSWBOUFAIVLPEKQDT_ZM",
        VIII: "FKQHTLXOCBJSPDZRAMEWNIUYGV_ZM",
    })
)

export const Enigma_default = Enigma_M3
