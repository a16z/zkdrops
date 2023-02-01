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
exports.toHex = exports.generateProofCallData = void 0;
/**
 * Library which abstracts away much of the details required to interact with the private airdrop contract.
 */
var snarkjs = require("snarkjs");
var Poseidon_1 = require("./Poseidon");
function generateProofCallData(merkleTree, key, secret, receiverAddr, circuitWasmBuffer, zkeyBuffer) {
    return __awaiter(this, void 0, void 0, function () {
        var inputs, _a, proof, publicSignals, proofProcessed, pubProcessed, allSolCallData, solCallDataProof;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, generateCircuitInputJson(merkleTree, key, secret, BigInt(receiverAddr))];
                case 1:
                    inputs = _b.sent();
                    return [4 /*yield*/, snarkjs.plonk.fullProve(inputs, circuitWasmBuffer, zkeyBuffer)];
                case 2:
                    _a = _b.sent(), proof = _a.proof, publicSignals = _a.publicSignals;
                    proofProcessed = unstringifyBigInts(proof);
                    pubProcessed = unstringifyBigInts(publicSignals);
                    return [4 /*yield*/, snarkjs.plonk.exportSolidityCallData(proofProcessed, pubProcessed)];
                case 3:
                    allSolCallData = _b.sent();
                    solCallDataProof = allSolCallData.split(',')[0];
                    return [2 /*return*/, solCallDataProof];
            }
        });
    });
}
exports.generateProofCallData = generateProofCallData;
function toHex(number, length) {
    if (length === void 0) { length = 32; }
    var str = number.toString(16);
    return '0x' + str.padStart(length * 2, '0');
}
exports.toHex = toHex;
function generateCircuitInputJson(mt, nullifier, secret, recieverAddr) {
    return __awaiter(this, void 0, void 0, function () {
        var commitment, mp, nullifierHash, inputObj;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, Poseidon_1.poseidon2)(nullifier, secret)];
                case 1:
                    commitment = _a.sent();
                    mp = mt.getMerkleProof(commitment);
                    return [4 /*yield*/, (0, Poseidon_1.poseidon1)(nullifier)];
                case 2:
                    nullifierHash = _a.sent();
                    inputObj = {
                        root: mt.root.val,
                        nullifierHash: nullifierHash,
                        nullifier: nullifier,
                        secret: secret,
                        pathIndices: mp.indices,
                        pathElements: mp.vals,
                        recipient: recieverAddr
                    };
                    return [2 /*return*/, inputObj];
            }
        });
    });
}
// Lifted from ffutils: https://github.com/iden3/ffjavascript/blob/master/src/utils_bigint.js
function unstringifyBigInts(o) {
    if ((typeof (o) == "string") && (/^[0-9]+$/.test(o))) {
        return BigInt(o);
    }
    else if ((typeof (o) == "string") && (/^0x[0-9a-fA-F]+$/.test(o))) {
        return BigInt(o);
    }
    else if (Array.isArray(o)) {
        return o.map(unstringifyBigInts);
    }
    else if (typeof o == "object") {
        var res_1 = {};
        var keys = Object.keys(o);
        keys.forEach(function (k) {
            res_1[k] = unstringifyBigInts(o[k]);
        });
        return res_1;
    }
    else {
        return o;
    }
}
function toBufferLE(bi, width) {
    var hex = bi.toString(16);
    var buffer = Buffer.from(hex.padStart(width * 2, '0').slice(0, width * 2), 'hex');
    buffer.reverse();
    return buffer;
}
