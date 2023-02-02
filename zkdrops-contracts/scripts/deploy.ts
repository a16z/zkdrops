import { ethers, waffle } from "hardhat";
import { abi as ERC20_ABI, bytecode as ERC20_BYTECODE } from "@openzeppelin/contracts/build/contracts/ERC20PresetFixedSupply.json";
import { BigNumber } from "@ethersproject/bignumber";
import { PrivateAirdrop } from "../typechain-types";
import { readMerkleTreeAndSourceFromFile } from "../utils/TestUtils";
import { toHex } from "zkdrops-lib";


/**
 * Deploys a test set of contracts: ERC20, Verifier, PrivateAirdrop and transfers some ERC20 to the
 * PrivateAirdrop contract.
 */
async function main() {
    // PARAMS
    let ERC20_SUPPLY = 100_000;
    let NUM_ERC20_TO_DISTRIBUTE = 80_000;
    let NUM_ERC20_PER_REDEMPTION = 10_000;

    let merkleTreeAndSource = await readMerkleTreeAndSourceFromFile("./test/data/mt_keys_8192.csv");
    let merkleTree = merkleTreeAndSource.merkleTree;

    let [ownerSigner] = await ethers.getSigners();

    let erc20Factory = new ethers.ContractFactory(ERC20_ABI, ERC20_BYTECODE, ownerSigner);
    let erc20 = await erc20Factory.deploy("zk-airdrop", "zkdrop", BigNumber.from(ERC20_SUPPLY), ownerSigner.address)
    console.log(`ERC20 address: ${erc20.address}`)

    let plonkFactory = await ethers.getContractFactory("PlonkVerifier")
    let plonk = await plonkFactory.deploy()
    console.log(`PlonkVerifier contract address: ${plonk.address}`)

    let mainFactory = await ethers.getContractFactory("PrivateAirdrop")
    let privateAirdrop: PrivateAirdrop = (
        await mainFactory.deploy(
            erc20.address,
            BigNumber.from(NUM_ERC20_PER_REDEMPTION),
            plonk.address, 
            toHex(merkleTree.root.val))) as PrivateAirdrop
    console.log(`PrivateAirdrop contract address: ${privateAirdrop.address}`);

    // Transfer ERC20s to contract
    await erc20.transfer(privateAirdrop.address, NUM_ERC20_TO_DISTRIBUTE);
}

main()
    .then(() => process.exit(0))
    .catch(e => {
        console.error(e);
        process.exit(1);
    })