import { expect } from "chai"
import { readFileSync } from "fs";
import { MerkleTree, mimcSponge } from "zkdrops-lib";
import { generateMerkleTreeAndKeys, readMerkleTreeAndSourceFromFile } from "../utils/TestUtils";

describe("MerkleTree", () => {
    it("can be constructed and destructed", async () => {
        let mtk = await generateMerkleTreeAndKeys(2**6);

        let ss1 = mtk.merkleTree.getStorageString();
        let mt2 = MerkleTree.createFromStorageString(ss1);
        let ss2 = mt2.getStorageString();

        expect(ss1).to.be.eq(ss2);
    });
    it("construction strategies match", async () => {
        let leaf_file = "./test/data/mt_8192.txt";
        let source_file = "./test/data/mt_keys_8192.csv";

        let merkleTreeAndSource = await readMerkleTreeAndSourceFromFile(source_file);
        let storageString = readFileSync(leaf_file).toString();
        let merkleTreeRaw = MerkleTree.createFromStorageString(storageString);

        expect(merkleTreeRaw.root.val).to.be.eq(merkleTreeAndSource.merkleTree.root.val);
    });
})