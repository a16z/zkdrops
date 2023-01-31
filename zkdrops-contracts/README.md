# zkdrops-contracts
## Useful commands 
- Test: `npx hardhat test`
- Build typechain: `npx hardhat compile`
- Generate circuit, zkey, solidity: `./build_scripts/build_all.sh`
- Generate local randomized Merkle Tree and keys: `ts-node scripts/gen_tree.ts`
- Generate local Merkle Tree from comma separated list of commitments: `ts-node ./scripts/gen_tree_from_file.ts <input filename> <output filename> <tree height>`
- Collect against local node: `npx hardhat run --network localhost scripts/collect.ts`

## Disclaimer
_These smart contracts are being provided as is. No guarantee, representation or warranty is being made, express or implied, as to the safety or correctness of the user interface or the smart contracts. They have not been audited and as such there can be no assurance they will work as intended, and users may experience delays, failures, errors, omissions or loss of transmitted information. In addition, any airdrop using these smart contracts should be conducted in accordance with applicable law. Nothing in this repo should be construed as investment advice or legal advice for any particular facts or circumstances and is not meant to replace competent counsel. It is strongly advised for you to contact a reputable attorney in your jurisdiction for any questions or concerns with respect thereto. a16z is not liable for any use of the foregoing, and users should proceed with caution and use at their own risk. See a16z.com/disclosure for more info._
