import { ethers } from "hardhat";
import { abi as ERC20_ABI } from "@openzeppelin/contracts/build/contracts/ERC20.json";
import { BigNumber, Contract } from "ethers";
import { abi as PRIVATE_AIRDROP_ABI } from "../artifacts/contracts/PrivateAirdrop.sol/PrivateAirdrop.json"
import { readFileSync } from "fs";
import { readMerkleTreeAndSourceFromFile } from "../utils/TestUtils";
import { generateProofCallData, pedersenHash, toHex } from "zkp-merkle-airdrop-lib";

/** Collect an airdrop from the local merkle tree against deployed contract. */
async function main() {
    let WASM_PATH = "./build/circuit_js/circuit.wasm";
    let ZKEY_PATH = "./build/circuit_final.zkey";

    let WASM_BUFF = readFileSync(WASM_PATH);
    let ZKEY_BUFF = readFileSync(ZKEY_PATH);

    let ERC20_ADDR = "";
    let AIRDROP_ADDR = "";
    let MT_KEYS_PATH = "./test/temp/mt_keys_8192.csv";

    let [collector] = await ethers.getSigners();

    let merkleTreeAndSource = readMerkleTreeAndSourceFromFile(MT_KEYS_PATH);
    let redeemIndex = 181;
    let key = merkleTreeAndSource.leafNullifiers[redeemIndex];
    let secret = merkleTreeAndSource.leafSecrets[redeemIndex];
    let proof = 
        await generateProofCallData(
            merkleTreeAndSource.merkleTree, 
            key, 
            secret, 
            collector.address,
            WASM_BUFF,
            ZKEY_BUFF);
    console.log("Proof: ", proof);

    let keyHash = toHex(pedersenHash(key));

    let airdropContract = new Contract(AIRDROP_ADDR, PRIVATE_AIRDROP_ABI, collector);
    let tx = await airdropContract.collectAirdrop(proof, keyHash);
    await tx.wait();

    console.log("Collected!")
    let erc20Contract = new Contract(ERC20_ADDR, ERC20_ABI, collector.provider!);
    let balance: BigNumber = await erc20Contract.balanceOf(collector.address)
    console.log(`Collector balance: ${balance.toString()}`)

}

main().then(() => process.exit(0))
    .catch(e => {
        console.error(e);
        process.exit(-1);
    })