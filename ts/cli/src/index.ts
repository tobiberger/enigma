#!/usr/bin/env node

import { Argument, Command, Option } from "commander"
import { asEnigmaLetter, EnigmaModel, RotorSetting, unsupportedCharacterBehaviours, UnsupportedCharactersBehaviour } from "@bergerle/enigma-core"
import * as fs from "fs"
import { runEnigma } from "./runEnigma"
import { Readable } from "stream"
import WritableStream = NodeJS.WritableStream

const parseRotorSettings = (value: string): RotorSetting[] => {
    return value.split(",").map((part) => {
        const asNumber = +part
        if (isNaN(asNumber)) {
            const enigmaLetter = asEnigmaLetter(part)
            if (enigmaLetter === undefined) {
                throw Error(`invalid configuration input - "${part}" is not a supported letter`)
            }
            return enigmaLetter
        } else {
            return asNumber
        }
    })
}

const readableStreamFrom = (text: string) => {
    const stream = new Readable()
    stream.push(text)
    stream.push(null)
    return stream
}

const textArgument = new Argument(
    "<text>",
    "text to en-/decrypt. If no text is specified, Enigma will read from STD IN. Don't provide text when using the -i option"
).argOptional()
textArgument.variadic = true
const enigmaProgram = new Command()
    .description("CLI tool for Enigma en-/decryption")
    .option("-w, --rotors <rotor1,rotor2,rotor3>", 'Rotor (wheel) order, usually expressed as Roman numerals, e.g. "IV,II,V"', "I,II,III")
    .option("-r, --ring-positions <rp1,rp2,rp3>", "Ring positions for each rotor. Can be numeric or a letter", "01,01,01")
    .option("-s, --start-positions <sp1,sp2,sp3>", "Start positions for each rotor. Can be numeric or a letter", "A,A,A")
    .option("-p, --plugboard <AB,CD,KF,LO>", "Connections on the Enigma plugboard")
    .option("-m, --model-config <path>", "path to custom machine config json file")
    .option("-u, --reflector <UKW_B>", "Selection of reflector wheel", "UKW_B")
    .addOption(
        new Option("-x, --unsupported-character <drop|keep|fail>", "Define behaviour when encountering unsupported characters, defaults to drop").choices(
            unsupportedCharacterBehaviours
        )
    )
    .option("-k", "keep unsupported characters (shorthand for [-x keep])")
    .option("-f", "fail on unsupported characters (shorthand for [-x fail])")
    .option("-i, --in <path>", "input source (optional)")
    .option("-o, --out <path>", "output destination (optional, defaults to STD OUT)")
    .addArgument(textArgument)
    .action((args: string[], options) => {
        const model = options.modelConfig ? new EnigmaModel(JSON.parse(fs.readFileSync(options.modelConfig).toString())) : undefined
        const input = options.in ? fs.createReadStream(options.in) : args ? readableStreamFrom(args.join(" ")) : process.stdin
        const output: WritableStream = options.out ? fs.createWriteStream(options.out) : process.stdout
        let unsupportedCharacters: UnsupportedCharactersBehaviour = options.unsupportedCharacter
        if (options.k) {
            if (unsupportedCharacters) {
                throw Error("specified multiple behaviours for unsupported characters")
            }
            unsupportedCharacters = "keep"
        }
        if (options.f) {
            if (unsupportedCharacters) {
                throw Error("specified multiple behaviours for unsupported characters")
            }
            unsupportedCharacters = "fail"
        }
        if (!unsupportedCharacters) {
            unsupportedCharacters = "drop"
        }
        runEnigma({
            model,
            configuration: {
                rotorIds: options.rotors.split(","),
                ringPositions: parseRotorSettings(options.ringPositions),
                startPositions: parseRotorSettings(options.startPositions),
                plugConnections: options.plugboard?.split(",") ?? [],
                reflectorId: options.reflector,
                unsupportedCharacters,
            },
            input,
            output,
        })
    })

enigmaProgram.parse()
