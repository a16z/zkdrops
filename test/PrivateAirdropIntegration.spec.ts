import { expect } from "chai";
import { ethers, waffle } from "hardhat";
import { PlonkVerifier, PrivateAirdrop } from "../typechain"
import { abi as ERC20_ABI, bytecode as ERC20_BYTECODE } from "@openzeppelin/contracts/build/contracts/ERC20PresetFixedSupply.json";
import { Contract } from "@ethersproject/contracts";
import { Signer } from "@ethersproject/abstract-signer";
import { BigNumber } from "@ethersproject/bignumber";
import { readFileSync } from "fs";
import { MerkleTree, generateProofCallData, pedersenHashConcat, pedersenHash, toHex } from "zkp-merkle-airdrop-lib";
import { randomBigInt, readMerkleTreeAndSourceFromFile } from "../utils/TestUtils";

// Test constants
let ERC20_SUPPLY = 100_000;
let NUM_ERC20_TO_DISTRIBUTE = 80_000;
let NUM_ERC20_PER_REDEMPTION = 10_000;

let WASM_PATH = "./build/circuit_js/circuit.wasm";
let ZKEY_PATH = "./build/circuit_final.zkey";

let WASM_BUFF = readFileSync(WASM_PATH);
let ZKEY_BUFF = readFileSync(ZKEY_PATH);
describe("PrivateAirdrop", async () => {
    // Load existing Merkle Tree from file to speed tests
    let merkleTreeAndSource = readMerkleTreeAndSourceFromFile("./test/temp/mt_keys_8192.csv");
    it("collects an airdrop, mixed", async () => {
        // Deploy contracts
        let hexRoot = toHex(merkleTreeAndSource.merkleTree.root.val)
        let [universalOwnerSigner, erc20SupplyHolder, redeemer] = await ethers.getSigners();
        let {erc20, verifier, airdrop} = 
            await deployContracts(
                universalOwnerSigner, 
                erc20SupplyHolder.address, 
                hexRoot);

        // Transfer airdroppable tokens to contract
        await erc20.connect(erc20SupplyHolder).transfer(airdrop.address, NUM_ERC20_TO_DISTRIBUTE);
        let contractBalanceInit: BigNumber = await erc20.balanceOf(airdrop.address);
        expect(contractBalanceInit.toNumber()).to.be.eq(NUM_ERC20_TO_DISTRIBUTE);

        let merkleTree = merkleTreeAndSource.merkleTree; 

        // Generate proof
        let leafIndex = 7;
        let key = merkleTreeAndSource.leafNullifiers[leafIndex];
        let secret = merkleTreeAndSource.leafSecrets[leafIndex];
        let callData = await generateProofCallData(merkleTree, key, secret, redeemer.address, WASM_BUFF, ZKEY_BUFF);

        // Collect
        let keyHash = toHex(pedersenHash(key))

        let execute = await (
            await airdrop.connect(redeemer).collectAirdrop(callData, keyHash)).wait()
        expect(execute.status).to.be.eq(1)
        let contractBalanceUpdated: BigNumber = await erc20.balanceOf(airdrop.address);
        expect(contractBalanceUpdated.toNumber()).to.be.eq(contractBalanceInit.toNumber() - NUM_ERC20_PER_REDEMPTION)
        let redeemerBalance: BigNumber = await erc20.balanceOf(redeemer.address);
        expect(redeemerBalance.toNumber()).to.be.eq(NUM_ERC20_PER_REDEMPTION)

    })

    it("cannot exploit using public inputs larger than the scalar field", async () => {
        // Deploy contracts
        let hexRoot = toHex(merkleTreeAndSource.merkleTree.root.val)
        let [universalOwnerSigner, erc20SupplyHolder, redeemer] = await ethers.getSigners();
        let {erc20, verifier, airdrop} = 
            await deployContracts(
                universalOwnerSigner, 
                erc20SupplyHolder.address, 
                hexRoot);

        // Transfer airdroppable tokens to contract
        await erc20.connect(erc20SupplyHolder).transfer(airdrop.address, NUM_ERC20_TO_DISTRIBUTE);
        let contractBalanceInit: BigNumber = await erc20.balanceOf(airdrop.address);
        expect(contractBalanceInit.toNumber()).to.be.eq(NUM_ERC20_TO_DISTRIBUTE);

        let merkleTree = merkleTreeAndSource.merkleTree; 

        // Generate proof
        let leafIndex = 7;
        let key = merkleTreeAndSource.leafNullifiers[leafIndex];
        let secret = merkleTreeAndSource.leafSecrets[leafIndex];
        let callData = await generateProofCallData(merkleTree, key, secret, redeemer.address, WASM_BUFF, ZKEY_BUFF);

        // Collect
        let keyHash = toHex(pedersenHash(key))
	let keyHashTwo = toHex(BigInt(keyHash) + BigInt('21888242871839275222246405745257275088548364400416034343698204186575808495617'))

        let execute = await (
            await airdrop.connect(redeemer).collectAirdrop(callData, keyHash)).wait()
        expect(execute.status).to.be.eq(1)
        let contractBalanceUpdated: BigNumber = await erc20.balanceOf(airdrop.address);
        expect(contractBalanceUpdated.toNumber()).to.be.eq(contractBalanceInit.toNumber() - NUM_ERC20_PER_REDEMPTION)
        let redeemerBalance: BigNumber = await erc20.balanceOf(redeemer.address);
        expect(redeemerBalance.toNumber()).to.be.eq(NUM_ERC20_PER_REDEMPTION)
        await expect(airdrop.connect(redeemer).collectAirdrop(callData, keyHashTwo)).to.be.revertedWith("Nullifier is not within the field")

    })

    it("cannot be front-run by another party", async () => {
        let hexRoot = toHex(merkleTreeAndSource.merkleTree.root.val)

        let [
            _a, 
            _b, 
            _c, 
            universalOwnerSigner, 
            erc20SupplyHolder, 
            redeemer, 
            frontrunner] = await ethers.getSigners();
        let {erc20, verifier, airdrop} = 
            await deployContracts(universalOwnerSigner, erc20SupplyHolder.address, hexRoot);

        // Transfer aidroppable tokens to contract
        await erc20.connect(erc20SupplyHolder).transfer(airdrop.address, NUM_ERC20_TO_DISTRIBUTE);
        let contractBalanceInit: BigNumber = await erc20.balanceOf(airdrop.address);
        expect(contractBalanceInit.toNumber()).to.be.eq(NUM_ERC20_TO_DISTRIBUTE);

        // Generate proof input
        let merkleTree = merkleTreeAndSource.merkleTree
        let leafIndex = 6;
        let nullifier = merkleTreeAndSource.leafNullifiers[leafIndex];
        let secret = merkleTreeAndSource.leafSecrets[leafIndex];
        let callData = await generateProofCallData(merkleTree, nullifier, secret, redeemer.address, WASM_BUFF, ZKEY_BUFF);

        // Check verification through main contract, expecting failure
        let nullifierHash = toHex(pedersenHash(nullifier))
        await expect(airdrop.connect(frontrunner).collectAirdrop(callData, nullifierHash)).to.be.revertedWith("Proof verification failed")
        let contractBalanceUpdated: BigNumber = await erc20.balanceOf(airdrop.address);
        expect(contractBalanceUpdated.toNumber()).to.be.eq(contractBalanceInit.toNumber())
        let frontrunnerBalance: BigNumber = await erc20.balanceOf(frontrunner.address);
        expect(frontrunnerBalance.toNumber()).to.be.eq(0)
    })

    it("can be updated", async () => {
        let initHexRoot = toHex(merkleTreeAndSource.merkleTree.root.val);

        let [_a,
            _b,
            _c,
            _d,
            _e,
            _f,
            _g,
            universalOwnerSigner, 
            erc20SupplyHolder, 
            redeemer] = await ethers.getSigners();
        let {erc20, verifier, airdrop} = 
            await deployContracts(
                universalOwnerSigner, 
                erc20SupplyHolder.address, 
                initHexRoot);

        // Transfer airdroppable tokens to contract
        await erc20.connect(erc20SupplyHolder).transfer(airdrop.address, NUM_ERC20_TO_DISTRIBUTE);
        let contractBalanceInit: BigNumber = await erc20.balanceOf(airdrop.address);
        expect(contractBalanceInit.toNumber()).to.be.eq(NUM_ERC20_TO_DISTRIBUTE);

        // Redeem 1
        let merkleTree = merkleTreeAndSource.merkleTree
        let redeemIndex = 222;
        let nullifier = merkleTreeAndSource.leafNullifiers[redeemIndex];
        let secret = merkleTreeAndSource.leafSecrets[redeemIndex];
        let callData = await generateProofCallData(merkleTree, nullifier, secret, redeemer.address, WASM_BUFF, ZKEY_BUFF);
        let nullifierHash = toHex(pedersenHash(nullifier))
        await expect(airdrop.connect(redeemer).collectAirdrop(callData, nullifierHash))

        // Check onlyOwner for addLeaf
        await expect(
            airdrop.connect(redeemer)
                .updateRoot(toHex(randomBigInt(32)))).to.be.revertedWith("Ownable: caller is not the owner")

        // Call addLeaf
        let newIndex = 555;
        let newNullifier = randomBigInt(31);
        let newSecret = randomBigInt(31);
        let newCommitment = pedersenHashConcat(newNullifier, newSecret);
        let newLeaves = merkleTreeAndSource.merkleTree.leaves.map(leaf => leaf.val);
        newLeaves[newIndex] = newCommitment;
        let newMerkleTree = MerkleTree.createFromLeaves(newLeaves);

        await airdrop.connect(universalOwnerSigner).updateRoot(toHex(newMerkleTree.root.val));

        // Redeem at the new leaf
        expect(newMerkleTree.root).to.be.not.eq(initHexRoot);
        let secondProof = 
            await generateProofCallData(newMerkleTree, newNullifier, newSecret, redeemer.address, WASM_BUFF, ZKEY_BUFF);
        let newNullifierHash = toHex(pedersenHash(newNullifier));
        await airdrop.connect(redeemer).collectAirdrop(secondProof, newNullifierHash);
        let redeemerBalance: BigNumber = await erc20.balanceOf(redeemer.address);
        expect(redeemerBalance.toNumber()).to.be.eq(NUM_ERC20_PER_REDEMPTION * 2);
    })
})

async function deployContracts(
    ownerSigner: Signer, 
    erc20SupplyHolder: string, 
    root: string): Promise<{erc20: Contract, verifier: PlonkVerifier, airdrop: PrivateAirdrop}> {
        let erc20 = await waffle.deployContract(
            ownerSigner,
            {bytecode: ERC20_BYTECODE, abi: ERC20_ABI}, 
            [
                "Zk-airdrop", 
                "ZkDRP", 
                BigNumber.from(ERC20_SUPPLY),
                erc20SupplyHolder
            ])
        let plonkFactory = await ethers.getContractFactory("PlonkVerifier", ownerSigner)
        let verifier = await plonkFactory.deploy()

        let airdropFactory = await ethers.getContractFactory("PrivateAirdrop", ownerSigner)
        let airdrop: PrivateAirdrop = (
            await airdropFactory.deploy(
                erc20.address,
                BigNumber.from(NUM_ERC20_PER_REDEMPTION),
                verifier.address, 
                root
                )) as PrivateAirdrop
        return {erc20, verifier, airdrop}
}
