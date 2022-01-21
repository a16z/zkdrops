import { BigNumber } from "ethers";
import { readFileSync, writeFileSync } from "fs";
import { exit } from "process";
import { MerkleTree } from "zkp-merkle-airdrop-lib";
import { randomBigInt } from "../utils/TestUtils";


/**
 *  Usage: ts-node ./scripts/gen_tree_from_file.ts <input file name> <out put file name> <tree height> 
 *    - (num commitments) = 2^(tree height)
 *    - input file is a comma separated list of commitments
 *    - output file will be the format described in the library MerkleTree object: https://github.com/a16z/zkp-merkle-airdrop-lib/blob/main/src/MerkleTree.ts
 */ 


let inputFileName = process.argv[2];
let outputFileName = process.argv[3];
let treeHeight = +process.argv[4];
console.log(`Generating ${treeHeight} tall MerkleTree from ${inputFileName}, writing to ${outputFileName}.`);

let input: string = readFileSync(inputFileName).toString();
let commitments = input.trim().split(",");

if (commitments.length > 2**treeHeight) {
    console.error(`Too many commitments for tree height. Maximum is ${2**treeHeight}`);
    exit(-1);
} else if (commitments.length != 2**treeHeight) {
    console.log(`Number of commitments provided (${commitments.length}) is not equal to total tree width (${2**treeHeight}), will fill in remainder with random commitments.`);
}

let commitmentsBigInt: BigInt[] = commitments.map(commitment => BigInt(commitment))
for (let i = commitments.length; i < 2**treeHeight; i ++) {
    commitmentsBigInt.push(randomBigInt(31));
}

let mt = MerkleTree.createFromLeaves(commitmentsBigInt);
let mtSs = mt.getStorageString();

writeFileSync(outputFileName, mtSs)