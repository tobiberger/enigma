export type EnigmaLetter =
    | "A"
    | "B"
    | "C"
    | "D"
    | "E"
    | "F"
    | "G"
    | "H"
    | "I"
    | "J"
    | "K"
    | "L"
    | "M"
    | "N"
    | "O"
    | "P"
    | "Q"
    | "R"
    | "S"
    | "T"
    | "U"
    | "V"
    | "W"
    | "X"
    | "Y"
    | "Z"

export const enigmaLetters: EnigmaLetter[] = [
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "I",
    "J",
    "K",
    "L",
    "M",
    "N",
    "O",
    "P",
    "Q",
    "R",
    "S",
    "T",
    "U",
    "V",
    "W",
    "X",
    "Y",
    "Z",
]

export const validateNumericEnigmaLetter = (numericValue: number): number => {
    if (numericValue < 1 || numericValue > enigmaLetters.length) {
        throw Error(`invalid number ${numericValue}, must be between 1 and ${enigmaLetters.length}`)
    }
    return numericValue
}

export const toEnigmaLetter = (numericValue: number): EnigmaLetter => {
    validateNumericEnigmaLetter(numericValue)
    return enigmaLetters[numericValue - 1]
}

export const toNumeric = (letter: EnigmaLetter): number => {
    const index = enigmaLetters.indexOf(letter)
    if (index === -1) {
        throw Error(`"${letter}" is not a letter supported by enigma`)
    }
    return index + 1
}

export const isEnigmaLetter = (letter: string): boolean => enigmaLetters.includes(letter as EnigmaLetter)
export const asEnigmaLetter = (letter: string): EnigmaLetter | undefined => (isEnigmaLetter(letter) ? (letter as EnigmaLetter) : undefined)
