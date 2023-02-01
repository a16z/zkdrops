// @ts-ignore -- no types
import { buildMimcSponge,  } from "circomlibjs";

let mimcSponger: any;

export async function mimcSponge(l: BigInt, r: BigInt): Promise<BigInt> {
    if (!mimcSponger) {
        mimcSponger = await buildMimcSponge()
    }

    let res = mimcSponger.multiHash([l, r]) as Uint8Array
    return mimcSponger.F.toObject(res);
}