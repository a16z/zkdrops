import { expect } from "chai"
import { MerkleTree } from "zkdrops-lib";
import { generateMerkleTreeAndKeys } from "../utils/TestUtils";

describe("MerkleTree", async () => {
    it("can be constructed and destructed", async () => {
        let mtk = await generateMerkleTreeAndKeys(2**6);

        let ss1 = mtk.merkleTree.getStorageString();
        let mt2 = MerkleTree.createFromStorageString(ss1);
        let ss2 = mt2.getStorageString();

        expect(ss1).to.be.eq(ss2);
    })
})