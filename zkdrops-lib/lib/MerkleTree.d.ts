/** Merkle tree of MimcSponge hashes */
export declare class MerkleTree {
    root: TreeNode;
    leaves: TreeNode[];
    constructor(linkedRoot: TreeNode, linkedLeaves: TreeNode[]);
    /**
     * For a set of leaves recursively computes hashes of adjacent nodes upwards until reaching a root.
     * Note: Significantly slower than `MerkleTree.createFromStorageString` as it rehashes the whole tree.
     */
    static createFromLeaves(leaves: BigInt[]): Promise<MerkleTree>;
    private static hashChildrenAndLinkToParent;
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
    static createFromStorageString(ss: string): MerkleTree;
    /**
     * Computes the MerkleProof for a given leafVal in the tree.
     */
    getMerkleProof(leafVal: BigInt): MerkleProof;
    /**
     *          A
     *        /   \
     *       B     C
     *      / \   / \
     *     D   E F   G
     *
     *  For tree above we create "A\nB,C\nD,E,F,G".
     */
    getStorageString(): string;
    leafExists(search: BigInt): boolean;
    /**
     *          A
     *        /   \
     *       B     C
     *      / \   / \
     *     D   E F   G
     *
     *  getChildRow([B,C]) -> [D,E,F,G]
     */
    private static getChildRow;
    private findMatchingLeaf;
}
export declare class TreeNode {
    val: BigInt;
    lChild?: TreeNode | undefined;
    rChild?: TreeNode | undefined;
    parent?: TreeNode | undefined;
    constructor(val: BigInt, lChild?: TreeNode | undefined, rChild?: TreeNode | undefined, parent?: TreeNode | undefined);
}
export interface MerkleProof {
    vals: BigInt[];
    indices: number[];
}
