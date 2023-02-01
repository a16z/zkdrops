/**
 * Library which abstracts away much of the details required to interact with the private airdrop contract.
 */
const snarkjs = require("snarkjs");

import { MerkleTree } from './MerkleTree';
import { poseidon1, poseidon2 } from './Poseidon';

export async function generateProofCallData(
        merkleTree: MerkleTree, 
        key: BigInt, 
        secret: BigInt, 
        receiverAddr: string,
        circuitWasmBuffer: Buffer,
        zkeyBuffer: Buffer): Promise<string> {
    let inputs = await generateCircuitInputJson(merkleTree, key, secret, BigInt(receiverAddr));

    let { proof, publicSignals } = await snarkjs.plonk.fullProve(inputs, circuitWasmBuffer, zkeyBuffer);

    let proofProcessed = unstringifyBigInts(proof);
    let pubProcessed = unstringifyBigInts(publicSignals);
    let allSolCallData: string = await snarkjs.plonk.exportSolidityCallData(proofProcessed, pubProcessed);
    let solCallDataProof = allSolCallData.split(',')[0];
    return solCallDataProof;
}

export function toHex(number: BigInt, length = 32) {
    const str: string = number.toString(16);
    return '0x' + str.padStart(length * 2, '0');
}

// Non-exported 

interface CircuitInput {
    root: BigInt;
    nullifierHash: BigInt;
    nullifier: BigInt;
    secret: BigInt;
    pathIndices: number[];
    pathElements: BigInt[];
    recipient: BigInt;
}

async function generateCircuitInputJson(
    mt: MerkleTree, 
    nullifier: BigInt, 
    secret: BigInt,
    recieverAddr: BigInt): Promise<CircuitInput> {
    let commitment = await poseidon2(nullifier, secret);
    let mp = mt.getMerkleProof(commitment);
    let nullifierHash = await poseidon1(nullifier);

    let inputObj = {
        root: mt.root.val,
        nullifierHash: nullifierHash,
        nullifier: nullifier,
        secret: secret,
        pathIndices: mp.indices,
        pathElements: mp.vals,
        recipient: recieverAddr
    }
    return inputObj;
}

// Lifted from ffutils: https://github.com/iden3/ffjavascript/blob/master/src/utils_bigint.js
function unstringifyBigInts(o: any): any {
    if ((typeof(o) == "string") && (/^[0-9]+$/.test(o) ))  {
        return BigInt(o);
    } else if ((typeof(o) == "string") && (/^0x[0-9a-fA-F]+$/.test(o) ))  {
        return BigInt(o);
    } else if (Array.isArray(o)) {
        return o.map(unstringifyBigInts);
    } else if (typeof o == "object") {
        const res: {[key: string]: any}= {};
        const keys = Object.keys(o);
        keys.forEach( (k) => {
            res[k] = unstringifyBigInts(o[k]);
        });
        return res;
    } else {
        return o;
    }
}

function toBufferLE(bi: BigInt, width: number): Buffer {
    const hex = bi.toString(16);
    const buffer =
        Buffer.from(hex.padStart(width * 2, '0').slice(0, width * 2), 'hex');
    buffer.reverse();
    return buffer;
}