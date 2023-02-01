// @ts-ignore -- no types
import { buildPedersenHash, buildBabyJub } from "circomlibjs";

let pedersenHasher: any;
let babyjub: any;

export async function pedersenHashBuff(buff: Buffer): Promise<BigInt> {
    if (!pedersenHasher) {
        pedersenHasher = await buildPedersenHash()
    }
    if (!babyjub) {
        babyjub = await buildBabyJub()
    }

    let point = pedersenHasher.hash(buff);
    return babyjub.unpackPoint(point)[0];
}

