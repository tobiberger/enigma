import { Enigma, EnigmaConfiguration, EnigmaModel } from "@bergerle/enigma-core"
import ReadableStream = NodeJS.ReadableStream
import WritableStream = NodeJS.WritableStream

export interface EnigmaParams {
    model?: EnigmaModel
    configuration: Partial<EnigmaConfiguration>
    input: ReadableStream
    output: WritableStream
}

export const runEnigma = ({ input, output, ...enigmaProps }: EnigmaParams): Promise<void> =>
    new Promise((resolve, reject) => {
        const enigma = new Enigma(enigmaProps)

        input.on("data", (data) => {
            const result = enigma.enter(data.toString())
            output.write(result)
            output.write("\n")
        })
        input.on("end", resolve)
        input.on("error", reject)
    })
