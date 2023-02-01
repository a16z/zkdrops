import { generateMerkleTreeAndKeys, saveMerkleTreeAndSource } from "../utils/TestUtils"

let TREE_HEIGHT = 13;

async function main() {
    let merkleTreeAndSource = await generateMerkleTreeAndKeys(2**TREE_HEIGHT)
    saveMerkleTreeAndSource(merkleTreeAndSource, "./test/data/")
}

main().then(() => process.exit(0))
    .catch(e => console.error(e))

// Local hashing times:
// 2^10 takes 700ms
// 2^11 takes 1611ms 
// ...