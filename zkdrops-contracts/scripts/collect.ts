import { ethers } from "hardhat";
import { abi as ERC20_ABI } from "@openzeppelin/contracts/build/contracts/ERC20.json";
import { BigNumber, Contract } from "ethers";
import { abi as PRIVATE_AIRDROP_ABI } from "../artifacts/contracts/PrivateAirdrop.sol/PrivateAirdrop.json"
import { readFileSync } from "fs";
import { readMerkleTreeAndSourceFromFile } from "../utils/TestUtils";
import { generateProofCallData, poseidon1, toHex } from "zkdrops-lib";

/** 
 * Collect an airdrop from the local merkle tree against deployed contract. 
 * 
 * npx hardhat run scripts/collect.ts --network localhost
 */
async function main() {
    let WASM_PATH = "./build/circuit_js/circuit.wasm";
    let ZKEY_PATH = "./build/circuit_final.zkey";

    let WASM_BUFF = readFileSync(WASM_PATH);
    let ZKEY_BUFF = readFileSync(ZKEY_PATH);

    let ERC20_ADDR = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    let AIRDROP_ADDR = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
    let MT_KEYS_PATH = "./test/data/mt_keys_8192.csv";

    let [collector] = await ethers.getSigners();

    let merkleTreeAndSource = await readMerkleTreeAndSourceFromFile(MT_KEYS_PATH);
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

    let keyHash = toHex(await poseidon1(key));

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