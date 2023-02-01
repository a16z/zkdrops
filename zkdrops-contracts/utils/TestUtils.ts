import * as crypto from "crypto";
import { readFileSync, writeFileSync } from 'fs';

import { MerkleTree, poseidon2, toHex } from 'zkdrops-lib';

/** MerkleTree and inputs used to derive. */
export interface MerkleTreeAndSource {
    merkleTree: MerkleTree;
    leafNullifiers: BigInt[];
    leafSecrets: BigInt[];
}

/**
 * Generates a Merkle Tree from random leaves of size @param numLeaves.
 */
export async function generateMerkleTreeAndKeys(numLeaves: number): Promise<MerkleTreeAndSource> {
    let leafNullifiers: BigInt[] = []
    let leafSecrets: BigInt[] = []
    let leaves: BigInt[] = []
    for (let i = 0; i < numLeaves; i++) {
        leafNullifiers.push(randomBigInt(31));
        leafSecrets.push(randomBigInt(31));
        let commitment = await poseidon2(leafNullifiers[i], leafSecrets[i]);
        leaves.push(commitment);
    }
    let merkleTree = await MerkleTree.createFromLeaves(leaves);
    return { merkleTree, leafNullifiers, leafSecrets };
}

export function saveMerkleTreeAndSource(mts: MerkleTreeAndSource, filePrefix: string = "") {
    if (mts.leafNullifiers.length != mts.leafSecrets.length) throw new Error("MTS improperly constructed.");

    let csvContent = "key,secret,commitment\n"
    for (let i = 0; i < mts.leafNullifiers.length; i++) {
        csvContent += toHex(mts.leafNullifiers[i]) 
            + "," 
            + toHex(mts.leafSecrets[i]) 
            + ","
            + toHex(mts.merkleTree.leaves[i].val)
            + "\n";
    }

    let keysPath = `${filePrefix}mt_keys_${mts.leafNullifiers.length}.csv`;
    writeFileSync(keysPath, csvContent);
    console.log(`Merkle tree keys written to ${keysPath}`)
    saveMerkleTree(mts.merkleTree, filePrefix);
}

export function saveMerkleTree(mt: MerkleTree, filePrefix: string = "") {
    let storage = mt.getStorageString();
    let path = `${filePrefix}mt_${mt.leaves.length}.txt`;
    writeFileSync(path, storage);
    console.log(`Merkle tree written to ${path}`);
}

export async function readMerkleTreeAndSourceFromFile(filename: string): Promise<MerkleTreeAndSource> {
    let leafNullifiers: BigInt[] = []
    let leafSecrets: BigInt[] = []
    let leaves: BigInt[] = []

    let contents = readFileSync(filename, "utf8")
    let lines = contents.split("\n")
    for (let i = 1; i < lines.length; i++) {
        let line = lines[i];
        let tokens = line.split(",");
        if (tokens.length < 3) continue;

        let key = tokens[0];
        let secret = tokens[1];
        let commitment = tokens[2].split("\n")[0];
        leafNullifiers.push(BigInt(key));
        leafSecrets.push(BigInt(secret));
        leaves.push(BigInt(commitment));
    }
    let merkleTree = await MerkleTree.createFromLeaves(leaves);
    return { merkleTree, leafNullifiers, leafSecrets };
}

export function randomBigInt(nBytes: number): BigInt {
    return toBigIntLE(crypto.randomBytes(nBytes));
}

export function toBigIntLE (buff: Buffer) {
    const reversed = Buffer.from(buff);
    reversed.reverse();
    const hex = reversed.toString('hex');
    if (hex.length === 0) {
      return BigInt(0);
    }
    return BigInt(`0x${hex}`);
}