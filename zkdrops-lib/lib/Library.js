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
        while (_) try {
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
exports.toHex = exports.pedersenHashConcat = exports.pedersenHash = exports.mimcSponge = exports.generateProofCallData = void 0;
/**
 * Library which abstracts away much of the details required to interact with the private airdrop contract.
 */
var snarkjs = require("snarkjs");
var circomlibjs = require('circomlibjs');
var wc = require("./witness_calculator.js");
function generateProofCallData(merkleTree, key, secret, receiverAddr, circuitWasmBuffer, zkeyBuffer) {
    return __awaiter(this, void 0, void 0, function () {
        var inputs, witnessCalculator, witnessBuffer, _a, proof, publicSignals, proofProcessed, pubProcessed, allSolCallData, solCallDataProof;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    inputs = generateCircuitInputJson(merkleTree, key, secret, BigInt(receiverAddr));
                    return [4 /*yield*/, wc(circuitWasmBuffer)];
                case 1:
                    witnessCalculator = _b.sent();
                    return [4 /*yield*/, witnessCalculator.calculateWTNSBin(inputs, 0)];
                case 2:
                    witnessBuffer = _b.sent();
                    return [4 /*yield*/, snarkjs.plonk.prove(zkeyBuffer, witnessBuffer)];
                case 3:
                    _a = _b.sent(), proof = _a.proof, publicSignals = _a.publicSignals;
                    proofProcessed = unstringifyBigInts(proof);
                    pubProcessed = unstringifyBigInts(publicSignals);
                    return [4 /*yield*/, snarkjs.plonk.exportSolidityCallData(proofProcessed, pubProcessed)];
                case 4:
                    allSolCallData = _b.sent();
                    solCallDataProof = allSolCallData.split(',')[0];
                    return [2 /*return*/, solCallDataProof];
            }
        });
    });
}
exports.generateProofCallData = generateProofCallData;
function mimcSponge(l, r) {
    return circomlibjs.mimcsponge.multiHash([l, r]);
}
exports.mimcSponge = mimcSponge;
function pedersenHash(nullifier) {
    return pedersenHashBuff(toBufferLE(nullifier, 31));
}
exports.pedersenHash = pedersenHash;
function pedersenHashConcat(nullifier, secret) {
    var nullBuff = toBufferLE(nullifier, 31);
    var secBuff = toBufferLE(secret, 31);
    var combinedBuffer = Buffer.concat([nullBuff, secBuff]);
    return pedersenHashBuff(combinedBuffer);
}
exports.pedersenHashConcat = pedersenHashConcat;
function toHex(number, length) {
    if (length === void 0) { length = 32; }
    var str = number.toString(16);
    return '0x' + str.padStart(length * 2, '0');
}
exports.toHex = toHex;
function generateCircuitInputJson(mt, nullifier, secret, recieverAddr) {
    var commitment = pedersenHashConcat(nullifier, secret);
    var mp = mt.getMerkleProof(commitment);
    var nullifierHash = pedersenHash(nullifier);
    var inputObj = {
        root: mt.root.val,
        nullifierHash: nullifierHash,
        nullifier: nullifier,
        secret: secret,
        pathIndices: mp.indices,
        pathElements: mp.vals,
        recipient: recieverAddr
    };
    return inputObj;
}
function pedersenHashBuff(buff) {
    var point = circomlibjs.pedersenHash.hash(buff);
    return circomlibjs.babyjub.unpackPoint(point)[0];
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
