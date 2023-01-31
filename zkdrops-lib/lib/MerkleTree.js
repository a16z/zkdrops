"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreeNode = exports.MerkleTree = void 0;
var Library_1 = require("./Library");
/** Merkle tree of MimcSponge hashes */
var MerkleTree = /** @class */ (function () {
    function MerkleTree(linkedRoot, linkedLeaves) {
        this.root = linkedRoot;
        this.leaves = linkedLeaves;
    }
    /**
     * For a set of leaves recursively computes hashes of adjacent nodes upwards until reaching a root.
     * Note: Significantly slower than `MerkleTree.createFromStorageString` as it rehashes the whole tree.
     */
    MerkleTree.createFromLeaves = function (leaves) {
        var leafNodes = leaves.map(function (leaf) { return new TreeNode(leaf); });
        var rootNode = MerkleTree.hashChildrenAndLinkToParent(leafNodes)[0];
        return new MerkleTree(rootNode, leafNodes);
    };
    MerkleTree.hashChildrenAndLinkToParent = function (levelLeaves) {
        if (levelLeaves.length == 1)
            return levelLeaves;
        var parents = [];
        for (var i = 0; i < levelLeaves.length; i += 2) {
            var l = levelLeaves[i];
            var r = levelLeaves[i + 1];
            var hash = (0, Library_1.mimcSponge)(l.val, r.val);
            var parent_1 = new TreeNode(hash, l, r);
            parents.push(parent_1);
            l.parent = parent_1;
            r.parent = parent_1;
        }
        return this.hashChildrenAndLinkToParent(parents);
    };
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
    MerkleTree.createFromStorageString = function (ss) {
        var lines = ss.split("\n");
        var rootNode = new TreeNode(BigInt(lines[0]));
        var currRow = [rootNode];
        for (var lineIndex = 1; lineIndex < lines.length; lineIndex++) {
            var vals = lines[lineIndex].split(",");
            if (vals.length / 2 != currRow.length)
                throw new Error("Malformatted tree.");
            for (var rowIndex = 0; rowIndex < currRow.length; rowIndex++) {
                var parent_2 = currRow[rowIndex];
                var lChild = new TreeNode(BigInt(vals[2 * rowIndex]), undefined, undefined, parent_2);
                var rChild = new TreeNode(BigInt(vals[2 * rowIndex + 1]), undefined, undefined, parent_2);
                parent_2.lChild = lChild;
                parent_2.rChild = rChild;
            }
            currRow = MerkleTree.getChildRow(currRow);
        }
        return new MerkleTree(rootNode, currRow);
    };
    /**
     * Computes the MerkleProof for a given leafVal in the tree.
     */
    MerkleTree.prototype.getMerkleProof = function (leafVal) {
        var leaf = this.findMatchingLeaf(leafVal);
        var merkleProof = {
            vals: new Array(),
            indices: new Array()
        };
        while (leaf.val != this.root.val) {
            if (leaf.parent.lChild.val == leaf.val) { // Right child
                merkleProof.vals.push(leaf.parent.rChild.val);
                merkleProof.indices.push(0);
            }
            else if (leaf.parent.rChild.val == leaf.val) { // Left child
                merkleProof.vals.push(leaf.parent.lChild.val);
                merkleProof.indices.push(1);
            }
            else {
                throw new Error("This shouldn't have happened.");
            }
            leaf = leaf.parent;
        }
        return merkleProof;
    };
    /**
     *          A
     *        /   \
     *       B     C
     *      / \   / \
     *     D   E F   G
     *
     *  For tree above we create "A\nB,C\nD,E,F,G".
     */
    MerkleTree.prototype.getStorageString = function () {
        var result = "";
        var currRow = [this.root];
        while (currRow.length > 0) {
            for (var i = 0; i < currRow.length; i++) {
                result += (0, Library_1.toHex)(currRow[i].val);
                if (i != currRow.length - 1)
                    result += ",";
            }
            currRow = MerkleTree.getChildRow(currRow);
            if (currRow.length != 0)
                result += "\n";
        }
        return result;
    };
    MerkleTree.prototype.leafExists = function (search) {
        return this.leaves.find(function (node) { return node.val == search; }) !== undefined;
    };
    /**
     *          A
     *        /   \
     *       B     C
     *      / \   / \
     *     D   E F   G
     *
     *  getChildRow([B,C]) -> [D,E,F,G]
     */
    MerkleTree.getChildRow = function (parentLevel) {
        var children = [];
        for (var _i = 0, parentLevel_1 = parentLevel; _i < parentLevel_1.length; _i++) {
            var parent_3 = parentLevel_1[_i];
            if (parent_3.lChild && parent_3.rChild) {
                children.push(parent_3.lChild);
                children.push(parent_3.rChild);
            }
        }
        return children;
    };
    MerkleTree.prototype.findMatchingLeaf = function (leafVal) {
        var matchingLeaf = this.leaves.find(function (leaf) { return leaf.val == leafVal; });
        if (matchingLeaf == undefined) {
            throw new Error("Failed to find leaf.");
        }
        return matchingLeaf;
    };
    return MerkleTree;
}());
exports.MerkleTree = MerkleTree;
var TreeNode = /** @class */ (function () {
    function TreeNode(val, lChild, rChild, parent) {
        this.val = val;
        this.lChild = lChild;
        this.rChild = rChild;
        this.parent = parent;
    }
    return TreeNode;
}());
exports.TreeNode = TreeNode;
