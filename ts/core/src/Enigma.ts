import { Enigma_default, EnigmaModel, EnigmaRotorWiring, validateSymmetry } from "./EnigmaModel"
import { defaultConfiguration, EnigmaConfiguration, PlugConnection, RotorSetting, UnsupportedCharactersBehaviour } from "./EnigmaConfiguration"
import { EnigmaRotor } from "./EnigmaRotor"
import { asEnigmaLetter, EnigmaLetter, enigmaLetters } from "./EnigmaLetter"

export class Enigma {
    private model: EnigmaModel
    private rotors: EnigmaRotor[]
    private plugBoard: Record<EnigmaLetter, EnigmaLetter>
    private reflector: EnigmaRotorWiring
    private unsupportedCharacterBehaviour: UnsupportedCharactersBehaviour

    constructor(props: { model?: EnigmaModel; configuration?: Partial<EnigmaConfiguration> } = {}) {
        this.model = props.model ?? Enigma_default
        this.rotors = [] // will be filled by configure(...) call
        this.plugBoard = { ...defaultPlugBoard } // will be filled by configure(...) call
        this.reflector = Enigma_default.getRotor(defaultConfiguration.reflectorId).wiring
        this.unsupportedCharacterBehaviour = defaultConfiguration.unsupportedCharacters
        this.configure({
            ...defaultConfiguration,
            ...props.configuration,
        })
    }

    /**
     * Configure all parameters of the Enigma. Partial configurations are possible.
     * Unspecified values will not be overridden, unless technically necessary
     * (e.g. changing the rotors will reset ring and start positions)
     * @param configuration Enigma configuration parameters, all optional
     * @return this instance
     */
    configure(configuration: Partial<EnigmaConfiguration>): Enigma {
        if (configuration.rotorIds !== undefined) {
            this.setRotors(configuration.rotorIds)
        }
        if (configuration.ringPositions !== undefined) {
            this.setRingPositions(configuration.ringPositions)
        }
        if (configuration.startPositions !== undefined) {
            this.setStartPositions(configuration.startPositions)
        }
        if (configuration.plugConnections !== undefined) {
            this.setPlugConnections(configuration.plugConnections)
        }
        if (configuration.reflectorId !== undefined) {
            this.setReflector(configuration.reflectorId)
        }
        if (configuration.unsupportedCharacters !== undefined) {
            this.setUnsupportedCharacterBehaviour(configuration.unsupportedCharacters)
        }
        return this
    }

    /**
     * Configure this Enigma with the supplied rotors. Available rotors depend on the selected Enigma model.
     * By default, the historic rotors of the Enigma I and M3 are available (I, II, III, IV, V, VI, VII, VIII, UKW_A, UKW_B, UKW_C).
     *
     * Setting the rotors will reset ring and start positions.
     *
     * The number of entries provided here determines how many rotors are actually used for encryption.
     * While historically most Enigma machines used 3 rotors, this implementation can handle more rotors and also use the same one in multiple slots.
     *
     * As common, the rotors are defined from left to right, so the first array entry is the slowest rotor, the last one the fastest.
     * @param rotorIds ids of available rotors in the selected model
     * @return this instance
     */
    setRotors(rotorIds: string[]): Enigma {
        this.rotors = rotorIds.map((rotorId) => new EnigmaRotor(this.model.getRotor(rotorId)))
        return this
    }

    /**
     * Set the ring positions for all active rotors
     * @param ringPositions desired ring positions for all rotors from left (slow) to right (fast)
     * @return this instance
     */
    setRingPositions(ringPositions: RotorSetting[]): Enigma {
        if (ringPositions.length !== this.rotors.length) {
            throw Error(`invalid input: the current setup uses ${this.rotors.length} rotors, but ${ringPositions.length} ring positions were provided`)
        }
        ringPositions.forEach((ringPosition, rotorIndex) => {
            this.rotors[rotorIndex].setRingPosition(ringPosition)
        })
        return this
    }

    getPositions(): EnigmaLetter[] {
        return this.rotors.map((rotor) => rotor.getPosition())
    }

    /**
     * Set the (start) positions for all active rotors
     * @param startPositions desired positions for all rotors from left (slow) to right (fast)
     * @return this instance
     */
    setStartPositions(startPositions: RotorSetting[]): Enigma {
        if (startPositions.length !== this.rotors.length) {
            throw Error(`invalid input: the current setup uses ${this.rotors.length} rotors, but ${startPositions.length} start positions were provided`)
        }
        startPositions.forEach((startPositions, rotorIndex) => {
            this.rotors[rotorIndex].setPosition(startPositions)
        })
        return this
    }

    /**
     * Set all connections on the Enigma's plug board. All previous connections are reset.
     * @param plugConnections desired connections for the Enigma plug board
     * @return this instance
     */
    setPlugConnections(plugConnections: PlugConnection[]): Enigma {
        this.plugBoard = { ...defaultPlugBoard }
        for (const plugConnection of plugConnections) {
            this.addPlugConnection(plugConnection)
        }
        return this
    }

    /**
     * Add a connection to the plug board. Existing connections remain untouched.
     * @param plugConnection new connection
     * @return this instance
     */
    addPlugConnection(plugConnection: PlugConnection): Enigma {
        if (typeof plugConnection === "string" && plugConnection.length !== 2) {
            throw Error(`invalid plug connection "${plugConnection}" - must be exactly two letters that should be connected`)
        }
        const [fromUnchecked, toUnchecked] = plugConnection
        const from = asEnigmaLetter(fromUnchecked)
        if (!from) {
            throw Error(`invalid plug connection - "${from}" is not a valid Enigma letter`)
        }
        if (this.plugBoard[from] !== from) {
            throw Error(`invalid plug connection - "${from}" is already connected to another letter`)
        }
        const to = asEnigmaLetter(toUnchecked)
        if (!to) {
            throw Error(`invalid plug connection - "${to}" is not a valid Enigma letter`)
        }
        if (this.plugBoard[to] !== to) {
            throw Error(`invalid plug connection - "${to}" is already connected to another letter`)
        }
        this.plugBoard[from] = to
        this.plugBoard[to] = from
        return this
    }

    /**
     * Set the reflector (Umkehrwalze).
     * This is handled like rotor configuration, but is restricted to rotor configurations with symmetrical wiring (if A->B then B->A)
     * @param reflectorId id of a symmetrical rotor available in the selected model
     * @return this instance
     */
    setReflector(reflectorId: string): Enigma {
        this.reflector = validateSymmetry(this.model.getRotor(reflectorId).wiring)
        return this
    }

    /**
     * Determine how the encryption should deal with unsupported characters.
     * Lowercase letters will automatically be converted to uppercase, everything else (including whitespaces) is affected by this setting
     *
     * Possible values:
     *  - "drop": ignore characters - they will not be present in the output
     *  - "keep": pass characters on to the output without any encryption
     *  - "fail": throw an Error when encountering an unsupported character
     *
     * @param behaviour desired behaviour
     * @return this instance
     */
    setUnsupportedCharacterBehaviour(behaviour: UnsupportedCharactersBehaviour): Enigma {
        this.unsupportedCharacterBehaviour = behaviour
        return this
    }

    enter(input: string): string {
        return [...input].reduce((result, letter) => {
            const enigmaLetter = asEnigmaLetter(letter.toUpperCase())
            if (!enigmaLetter) {
                switch (this.unsupportedCharacterBehaviour) {
                    case "drop":
                        return result
                    case "keep":
                        return result + letter
                    case "fail":
                        throw Error(`Enigma failed - encountered unsupported character "${letter}".`)
                    default:
                        throw Error(`Enigma config error - unknown unsupported character behaviour "${this.unsupportedCharacterBehaviour}"`)
                }
            }

            // rotate rotor(s) before en-/decrypting the letter
            let rotorId = this.rotors.length - 1
            let shouldRotateNext = true
            while (shouldRotateNext && rotorId >= 0) {
                shouldRotateNext = this.rotors[rotorId].rotate()
                rotorId--
            }

            let currentValue = this.plugBoard[enigmaLetter]
            for (rotorId = this.rotors.length - 1; rotorId >= 0; rotorId--) {
                currentValue = this.rotors[rotorId].passForward(currentValue)
            }
            currentValue = this.reflector[currentValue]
            for (rotorId = 0; rotorId < this.rotors.length; rotorId++) {
                currentValue = this.rotors[rotorId].passReverse(currentValue)
            }
            currentValue = this.plugBoard[currentValue]

            return result + currentValue
        }, "")
    }
}

const defaultPlugBoard: Record<EnigmaLetter, EnigmaLetter> = enigmaLetters.reduce((plugBoard, letter) => {
    plugBoard[letter] = letter
    return plugBoard
}, {} as Record<EnigmaLetter, EnigmaLetter>)
