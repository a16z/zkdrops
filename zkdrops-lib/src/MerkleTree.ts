import { mimcSponge, toHex } from "./Library";

/** Merkle tree of MimcSponge hashes */
export class MerkleTree {
    public root: TreeNode;
    public leaves: TreeNode[];
    constructor(linkedRoot: TreeNode, linkedLeaves: TreeNode[]) {
        this.root = linkedRoot;
        this.leaves = linkedLeaves;
    }

    /**
     * For a set of leaves recursively computes hashes of adjacent nodes upwards until reaching a root. 
     * Note: Significantly slower than `MerkleTree.createFromStorageString` as it rehashes the whole tree.
     */
    public static createFromLeaves(leaves: BigInt[]): MerkleTree {
        let leafNodes = leaves.map(leaf => new TreeNode(leaf));
        let rootNode = MerkleTree.hashChildrenAndLinkToParent(leafNodes)[0];
        return new MerkleTree(rootNode, leafNodes);
    }

    private static hashChildrenAndLinkToParent(levelLeaves: TreeNode[]): TreeNode[] {
        if (levelLeaves.length == 1) return levelLeaves;
        let parents: TreeNode[] = [];
        for (let i = 0; i < levelLeaves.length; i+= 2) {
            let l = levelLeaves[i];
            let r = levelLeaves[i+1];
            let hash = mimcSponge(l.val, r.val);
            let parent = new TreeNode(hash, l, r);
            parents.push(parent);
            l.parent = parent;
            r.parent = parent;
        }
        return this.hashChildrenAndLinkToParent(parents);
    }

    /** 
     * 
     *  For ("A\nB,C\nD,E,F,G"), return the MerkleTree boject(A).
     * 
     *          A
     *        /   \
     *       B     C
     *      / \   / \
     *     D   E F   G
     * 
     */
    public static createFromStorageString(ss: string): MerkleTree {
        let lines = ss.split("\n");

        let rootNode = new TreeNode(BigInt(lines[0]));
        let currRow: TreeNode[] = [rootNode];
        for (let lineIndex = 1; lineIndex < lines.length; lineIndex++) {
            let vals = lines[lineIndex].split(",");

            if (vals.length / 2 != currRow.length) throw new Error("Malformatted tree.");

            for (let rowIndex = 0; rowIndex < currRow.length; rowIndex++) {
                let parent = currRow[rowIndex]
                let lChild = new TreeNode(BigInt(vals[2*rowIndex]), undefined, undefined, parent);
                let rChild = new TreeNode(BigInt(vals[2*rowIndex + 1]), undefined, undefined, parent);
                parent.lChild = lChild;
                parent.rChild = rChild;
            }
            currRow = MerkleTree.getChildRow(currRow);
        }
        return new MerkleTree(rootNode, currRow);
    }

    /**
     * Computes the MerkleProof for a given leafVal in the tree. 
     */
    public getMerkleProof(leafVal: BigInt): MerkleProof {
        var leaf = this.findMatchingLeaf(leafVal);
        let merkleProof: MerkleProof = {
            vals: new Array<BigInt>(), 
            indices: new Array<number>()
        };

        while (leaf.val != this.root.val) {
            if (leaf.parent!.lChild!.val == leaf.val) { // Right child
                merkleProof.vals.push(leaf.parent!.rChild!.val);
                merkleProof.indices.push(0);
            } else if (leaf.parent!.rChild!.val == leaf.val) { // Left child
                merkleProof.vals.push(leaf.parent!.lChild!.val);
                merkleProof.indices.push(1);
            } else {
                throw new Error("This shouldn't have happened.")
            }
            leaf = leaf.parent!;
        }

        return merkleProof;
    }

    /** 
     *          A
     *        /   \
     *       B     C
     *      / \   / \
     *     D   E F   G
     * 
     *  For tree above we create "A\nB,C\nD,E,F,G".
     */
    public getStorageString(): string {
        let result = "";
        let currRow = [this.root];
        while(currRow.length > 0) {
            for (let i = 0; i < currRow.length; i++) {
                result += toHex(currRow[i].val);
                if (i != currRow.length - 1) result += ",";
            }

            currRow = MerkleTree.getChildRow(currRow);
            if (currRow.length != 0) result += "\n";
        }
        return result;
    }

    public leafExists(search: BigInt): boolean {
        return this.leaves.find(node => node.val == search) !== undefined
    }

    /** 
     *          A
     *        /   \
     *       B     C
     *      / \   / \
     *     D   E F   G
     * 
     *  getChildRow([B,C]) -> [D,E,F,G]
     */
    private static getChildRow(parentLevel: TreeNode[]): TreeNode[] {
        let children: TreeNode[] = [];
        for (let parent of parentLevel) {
            if (parent.lChild && parent.rChild) {
                children.push(parent.lChild);
                children.push(parent.rChild);
            }
        }
        return children;
    }

    private findMatchingLeaf(leafVal: BigInt): TreeNode {
        let matchingLeaf = this.leaves.find(leaf => leaf.val == leafVal);
        if (matchingLeaf == undefined) {
            throw new  Error("Failed to find leaf.");
        }
        return matchingLeaf!;
    }
}

export class TreeNode {
    constructor(
        public val: BigInt, 
        public lChild?: TreeNode, 
        public rChild?: TreeNode, 
        public parent?: TreeNode) {}
}

export interface MerkleProof {
    vals: BigInt[];
    indices: number[]; // 0 if proofVal on left, 1 if proofVal on right
}