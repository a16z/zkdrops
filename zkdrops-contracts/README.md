# ZKP Private Airdrop
## Purpose
Distributing an airdrop to users is simple if you already have their public keys, but protocols may want to do so according to off-chain activities. Although one could request addresses from users over a public or private channel, many users would prefer not to disclose their public keys. 

This repo demonstrates a strategy for distributing tokens where users can provide a message (known as the 'commitment') over a public channel and later claim their portion of the airdrop by providing a zero-knowledge proof that they belong in the Merkle tree. Claiming tokens in this manner mixes them with all other users entitled to an airdrop, protecting their anonymity.

A self-contained library for generating claim proofs and interacting with these contracts can be found at [a16z/zkp-merkle-airdrop-lib](https://github.com/a16z/zkp-merkle-airdrop-lib), and an example front-end can be found at [a16z/zkp-merkle-airdrop-fe-ex](https://github.com/a16z/zkp-merkle-airdrop-fe-ex).

The smart contract for distributions (`./contracts/PrivateAirdrop.sol`) includes an `updateRoot` function which allows the owner to modify the Merkle tree after launch, but can be made immutable by removing that function if desired.

## How This Works
- Users create a `key` and a `secret`, and concatenate `hash(key + secret)` to create the `commitment`.
- The `commitment` can then be transmitted across a public or private channel without leaking information.
- An admin assembles a Merkle tree of these `commitments` and deploys the smart contracts.
- Users can then redeem with a zero-knoweldge proof that they belong in the Merkle tree without revealing which `commitment` is associated with their public key.
- Note that on-chain verification requires ~350k gas.

![zk proof diagram](https://github.com/a16z/zkp-merkle-airdrop-contracts/blob/main/merkle_proof.jpg?raw=true)

## Related Work and Credits
- [Tornado.cash](https://tornado.cash/): the methods, tools, and concepts come from a simplified version of the original tornado cash protocol. Much of the circuit is lifted directly.
- [circom](https://github.com/iden3/circom) for compiling zkSnarks.
- [snarkjs](https://github.com/iden3/snarkjs) for various utilities.
- [circomlibjs](https://github.com/iden3/circomlibjs) for JavaScript equivalents of cryptographic functions.
- [Polygon Hermez's PowersOfTau](https://blog.hermez.io/hermez-cryptographic-setup/) ptau file in `./build/pot16_final.ptau` for trusted setup.

## Installation
- `gh repo clone a16z/zkp-merkle-airdrop-contracts -- --recurse-submodules`
- `npm i`
- `npx hardhat compile`
- For generating circuits: [Circom 2.0 install + snarkjs](https://docs.circom.io/getting-started/installation/)

## Useful commands 
- Test: `npx hardhat test`
- Build typechain: `npx hardhat compile`
- Generate circuit, zkey, solidity: `./build_scripts/build_all.sh`
- Generate local randomized Merkle Tree and keys: `ts-node scripts/gen_tree.ts`
- Generate local Merkle Tree from comma separated list of commitments: `ts-node ./scripts/gen_tree_from_file.ts <input filename> <output filename> <tree height>`
- Collect against local node: `npx hardhat run --network localhost scripts/collect.ts`

## Disclaimer
_These smart contracts are being provided as is. No guarantee, representation or warranty is being made, express or implied, as to the safety or correctness of the user interface or the smart contracts. They have not been audited and as such there can be no assurance they will work as intended, and users may experience delays, failures, errors, omissions or loss of transmitted information. In addition, any airdrop using these smart contracts should be conducted in accordance with applicable law. Nothing in this repo should be construed as investment advice or legal advice for any particular facts or circumstances and is not meant to replace competent counsel. It is strongly advised for you to contact a reputable attorney in your jurisdiction for any questions or concerns with respect thereto. a16z is not liable for any use of the foregoing, and users should proceed with caution and use at their own risk. See a16z.com/disclosure for more info._
