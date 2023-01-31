import { readFileSync } from "fs";
import { ethers } from "hardhat";
import { generateProofCallData } from "zkp-merkle-airdrop-lib";
import { readMerkleTreeAndSourceFromFile, saveMerkleTree } from "../utils/TestUtils";

/**
 * Generate a proof from a key, secret and locally stored merkleTree.
 */

let WASM_PATH = "./build/circuit_js/circuit.wasm";
let ZKEY_PATH = "./build/circuit_final.zkey";
let MT_KEYS_PATH = "./test/temp/mt_keys_8192.csv";

let WASM_BUFF = readFileSync(WASM_PATH);
let ZKEY_BUFF = readFileSync(ZKEY_PATH);

async function main() {
    let redeemer = (await ethers.getSigners())[0];
    let merkleTreeAndSource = readMerkleTreeAndSourceFromFile(MT_KEYS_PATH);
    let redeemIndex = 168;
    let key = merkleTreeAndSource.leafNullifiers[redeemIndex];
    let secret = merkleTreeAndSource.leafSecrets[redeemIndex];
    let calldata = 
        await generateProofCallData(
            merkleTreeAndSource.merkleTree, 
            key, 
            secret, 
            redeemer.address,
            WASM_BUFF,
            ZKEY_BUFF);

    console.log("proof calldata: ", calldata);
}

main()
    .then(() => process.exit(0))
    .catch(e => {
        console.error(e);
        process.exit(-1);
    })