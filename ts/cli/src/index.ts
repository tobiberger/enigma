#!/usr/bin/env node

import { Argument, Command } from "commander"

const enigmaProgram = new Command()
    .description("CLI tool for Enigma en-/decryption")
    .version("1.0.0")
    .addArgument(new Argument("<text>", "text to en-/decrypt, use '-' for std in").argOptional().default("-"))
    .requiredOption("-w, --wheel-order <wheel1,wheel2,wheel3>", 'Wheel order, usually expressed as Roman numerals, e.g. "IV,II,V"')
    .option("-o, --out <path>", "output destination, defaults to '-' for std out", "-")
    .option("-m, --machine-config <path>", "path to custom machine config")
    .action((args, options) => {
        console.log(args, options)
    })

enigmaProgram.parse()
