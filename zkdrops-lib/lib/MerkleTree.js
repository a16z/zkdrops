"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreeNode = exports.MerkleTree = void 0;
var Library_1 = require("./Library");
var Mimc_1 = require("./Mimc");
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
        return __awaiter(this, void 0, void 0, function () {
            var leafNodes, rootNode;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        leafNodes = leaves.map(function (leaf) { return new TreeNode(leaf); });
                        return [4 /*yield*/, MerkleTree.hashChildrenAndLinkToParent(leafNodes)];
                    case 1:
                        rootNode = (_a.sent())[0];
                        return [2 /*return*/, new MerkleTree(rootNode, leafNodes)];
                }
            });
        });
    };
    MerkleTree.hashChildrenAndLinkToParent = function (levelLeaves) {
        return __awaiter(this, void 0, void 0, function () {
            var parents, i, l, r, hash, parent_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (levelLeaves.length == 1)
                            return [2 /*return*/, levelLeaves];
                        parents = [];
                        i = 0;
                        _a.label = 1;
                    case 1:
                        if (!(i < levelLeaves.length)) return [3 /*break*/, 4];
                        l = levelLeaves[i];
                        r = levelLeaves[i + 1];
                        return [4 /*yield*/, (0, Mimc_1.mimcSponge)(l.val, r.val)];
                    case 2:
                        hash = _a.sent();
                        parent_1 = new TreeNode(hash, l, r);
                        parents.push(parent_1);
                        l.parent = parent_1;
                        r.parent = parent_1;
                        _a.label = 3;
                    case 3:
                        i += 2;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/, this.hashChildrenAndLinkToParent(parents)];
                }
            });
        });
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
