import { Enigma, EnigmaConfiguration, EnigmaModel, RotorSetting } from "@bergerle/enigma-core"
import ReadableStream = NodeJS.ReadableStream
import WritableStream = NodeJS.WritableStream

export interface EnigmaParams {
    model?: EnigmaModel
    configuration: Partial<EnigmaConfiguration>
    input: ReadableStream
    output: WritableStream
    commandsEnabled: boolean
}

export const runEnigma = ({ input, output, commandsEnabled, ...enigmaProps }: EnigmaParams): Promise<void> =>
    new Promise((resolve, reject) => {
        const enigma = new Enigma(enigmaProps)

        input.on("data", (data) => {
            const text = data.toString()
            if (commandsEnabled && text.startsWith("/")) {
                handleCommand(text, enigma)
                return
            }
            const result = enigma.enter(text)
            output.write(result)
            output.write("\n")
        })
        input.on("end", resolve)
        input.on("error", reject)
    })

const handleCommand = (input: string, enigma: Enigma) => {
    const args = input.trim().split(/,\s/)
    const command = args.shift() as string
    const config = commands[command]
    if (config) {
        config.run(args, enigma)
    } else {
        console.error(`unknown command ${command}`)
        commands["/help"].run(args, enigma)
    }
}

const commands: Record<string, { description: string; run: (args: string[], enigma: Enigma) => void }> = {
    "/help": {
        description: "Print this help",
        run: () => {
            console.error(`Available Commands:${Object.entries(commands).map(([command, props]) => `\n    ${command} - ${props.description}`)}`)
        },
    },
    "/position": {
        description: "Get or set current rotor position: /position Q V C",
        run: (args: string[], enigma: Enigma) => {
            if (args.length === 0) {
                console.error(enigma.getPositions().join(" "))
            } else {
                enigma.setStartPositions(args as RotorSetting[])
            }
        },
    },
}
