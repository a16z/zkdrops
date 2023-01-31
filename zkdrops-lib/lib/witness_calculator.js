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
module.exports = function builder(code, options) {
    return __awaiter(this, void 0, void 0, function () {
        function getMessage() {
            var message = "";
            var c = instance.exports.getMessageChar();
            while (c != 0) {
                message += String.fromCharCode(c);
                c = instance.exports.getMessageChar();
            }
            return message;
        }
        function printSharedRWMemory() {
            var shared_rw_memory_size = instance.exports.getFieldNumLen32();
            var arr = new Uint32Array(shared_rw_memory_size);
            for (var j = 0; j < shared_rw_memory_size; j++) {
                arr[shared_rw_memory_size - 1 - j] = instance.exports.readSharedRWMemory(j);
            }
            console.log(fromArray32(arr));
        }
        var wasmModule, wc, instance, sanityCheck;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    options = options || {};
                    return [4 /*yield*/, WebAssembly.compile(code)];
                case 1:
                    wasmModule = _a.sent();
                    return [4 /*yield*/, WebAssembly.instantiate(wasmModule, {
                            runtime: {
                                exceptionHandler: function (code) {
                                    var errStr;
                                    if (code == 1) {
                                        errStr = "Signal not found. ";
                                    }
                                    else if (code == 2) {
                                        errStr = "Too many signals set. ";
                                    }
                                    else if (code == 3) {
                                        errStr = "Signal already set. ";
                                    }
                                    else if (code == 4) {
                                        errStr = "Assert Failed. ";
                                    }
                                    else if (code == 5) {
                                        errStr = "Not enough memory. ";
                                    }
                                    else {
                                        errStr = "Unknown error\n";
                                    }
                                    // get error message from wasm
                                    errStr += getMessage();
                                    throw new Error(errStr);
                                },
                                showSharedRWMemory: function () {
                                    printSharedRWMemory();
                                }
                            }
                        })];
                case 2:
                    instance = _a.sent();
                    sanityCheck = options;
                    //        options &&
                    //        (
                    //            options.sanityCheck ||
                    //            options.logGetSignal ||
                    //            options.logSetSignal ||
                    //            options.logStartComponent ||
                    //            options.logFinishComponent
                    //        );
                    wc = new WitnessCalculator(instance, sanityCheck);
                    return [2 /*return*/, wc];
            }
        });
    });
};
var WitnessCalculator = /** @class */ (function () {
    function WitnessCalculator(instance, sanityCheck) {
        this.instance = instance;
        this.version = this.instance.exports.getVersion();
        this.n32 = this.instance.exports.getFieldNumLen32();
        this.instance.exports.getRawPrime();
        var arr = new Array(this.n32);
        for (var i = 0; i < this.n32; i++) {
            arr[this.n32 - 1 - i] = this.instance.exports.readSharedRWMemory(i);
        }
        this.prime = fromArray32(arr);
        this.witnessSize = this.instance.exports.getWitnessSize();
        this.sanityCheck = sanityCheck;
    }
    WitnessCalculator.prototype.circom_version = function () {
        return this.instance.exports.getVersion();
    };
    WitnessCalculator.prototype._doCalculateWitness = function (input, sanityCheck) {
        return __awaiter(this, void 0, void 0, function () {
            var keys, input_counter;
            var _this = this;
            return __generator(this, function (_a) {
                //input is assumed to be a map from signals to arrays of bigints
                this.instance.exports.init((this.sanityCheck || sanityCheck) ? 1 : 0);
                keys = Object.keys(input);
                input_counter = 0;
                keys.forEach(function (k) {
                    var h = fnvHash(k);
                    var hMSB = parseInt(h.slice(0, 8), 16);
                    var hLSB = parseInt(h.slice(8, 16), 16);
                    var fArr = flatArray(input[k]);
                    for (var i = 0; i < fArr.length; i++) {
                        var arrFr = toArray32(fArr[i], _this.n32);
                        for (var j = 0; j < _this.n32; j++) {
                            _this.instance.exports.writeSharedRWMemory(j, arrFr[_this.n32 - 1 - j]);
                        }
                        try {
                            _this.instance.exports.setInputSignal(hMSB, hLSB, i);
                            input_counter++;
                        }
                        catch (err) {
                            // console.log(`After adding signal ${i} of ${k}`)
                            throw new Error(err);
                        }
                    }
                });
                if (input_counter < this.instance.exports.getInputSize()) {
                    throw new Error("Not all inputs have been set. Only ".concat(input_counter, " out of ").concat(this.instance.exports.getInputSize()));
                }
                return [2 /*return*/];
            });
        });
    };
    WitnessCalculator.prototype.calculateWitness = function (input, sanityCheck) {
        return __awaiter(this, void 0, void 0, function () {
            var w, i, arr, j;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        w = [];
                        return [4 /*yield*/, this._doCalculateWitness(input, sanityCheck)];
                    case 1:
                        _a.sent();
                        for (i = 0; i < this.witnessSize; i++) {
                            this.instance.exports.getWitness(i);
                            arr = new Uint32Array(this.n32);
                            for (j = 0; j < this.n32; j++) {
                                arr[this.n32 - 1 - j] = this.instance.exports.readSharedRWMemory(j);
                            }
                            w.push(fromArray32(arr));
                        }
                        return [2 /*return*/, w];
                }
            });
        });
    };
    WitnessCalculator.prototype.calculateBinWitness = function (input, sanityCheck) {
        return __awaiter(this, void 0, void 0, function () {
            var buff32, buff, i, pos, j;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        buff32 = new Uint32Array(this.witnessSize * this.n32);
                        buff = new Uint8Array(buff32.buffer);
                        return [4 /*yield*/, this._doCalculateWitness(input, sanityCheck)];
                    case 1:
                        _a.sent();
                        for (i = 0; i < this.witnessSize; i++) {
                            this.instance.exports.getWitness(i);
                            pos = i * this.n32;
                            for (j = 0; j < this.n32; j++) {
                                buff32[pos + j] = this.instance.exports.readSharedRWMemory(j);
                            }
                        }
                        return [2 /*return*/, buff];
                }
            });
        });
    };
    WitnessCalculator.prototype.calculateWTNSBin = function (input, sanityCheck) {
        return __awaiter(this, void 0, void 0, function () {
            var buff32, buff, n8, idSection1length, idSection1lengthHex, pos, j, idSection2length, idSection2lengthHex, i, j;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        buff32 = new Uint32Array(this.witnessSize * this.n32 + this.n32 + 11);
                        buff = new Uint8Array(buff32.buffer);
                        return [4 /*yield*/, this._doCalculateWitness(input, sanityCheck)];
                    case 1:
                        _a.sent();
                        //"wtns"
                        buff[0] = "w".charCodeAt(0);
                        buff[1] = "t".charCodeAt(0);
                        buff[2] = "n".charCodeAt(0);
                        buff[3] = "s".charCodeAt(0);
                        //version 2
                        buff32[1] = 2;
                        //number of sections: 2
                        buff32[2] = 2;
                        //id section 1
                        buff32[3] = 1;
                        n8 = this.n32 * 4;
                        idSection1length = 8 + n8;
                        idSection1lengthHex = idSection1length.toString(16);
                        buff32[4] = parseInt(idSection1lengthHex.slice(0, 8), 16);
                        buff32[5] = parseInt(idSection1lengthHex.slice(8, 16), 16);
                        //this.n32
                        buff32[6] = n8;
                        //prime number
                        this.instance.exports.getRawPrime();
                        pos = 7;
                        for (j = 0; j < this.n32; j++) {
                            buff32[pos + j] = this.instance.exports.readSharedRWMemory(j);
                        }
                        pos += this.n32;
                        // witness size
                        buff32[pos] = this.witnessSize;
                        pos++;
                        //id section 2
                        buff32[pos] = 2;
                        pos++;
                        idSection2length = n8 * this.witnessSize;
                        idSection2lengthHex = idSection2length.toString(16);
                        buff32[pos] = parseInt(idSection2lengthHex.slice(0, 8), 16);
                        buff32[pos + 1] = parseInt(idSection2lengthHex.slice(8, 16), 16);
                        pos += 2;
                        for (i = 0; i < this.witnessSize; i++) {
                            this.instance.exports.getWitness(i);
                            for (j = 0; j < this.n32; j++) {
                                buff32[pos + j] = this.instance.exports.readSharedRWMemory(j);
                            }
                            pos += this.n32;
                        }
                        return [2 /*return*/, buff];
                }
            });
        });
    };
    return WitnessCalculator;
}());
function toArray32(s, size) {
    var res = []; //new Uint32Array(size); //has no unshift
    var rem = BigInt(s);
    var radix = BigInt(0x100000000);
    while (rem) {
        res.unshift(Number(rem % radix));
        rem = rem / radix;
    }
    if (size) {
        var i = size - res.length;
        while (i > 0) {
            res.unshift(0);
            i--;
        }
    }
    return res;
}
function fromArray32(arr) {
    var res = BigInt(0);
    var radix = BigInt(0x100000000);
    for (var i = 0; i < arr.length; i++) {
        res = res * radix + BigInt(arr[i]);
    }
    return res;
}
function flatArray(a) {
    var res = [];
    fillArray(res, a);
    return res;
    function fillArray(res, a) {
        if (Array.isArray(a)) {
            for (var i = 0; i < a.length; i++) {
                fillArray(res, a[i]);
            }
        }
        else {
            res.push(a);
        }
    }
}
function fnvHash(str) {
    var uint64_max = BigInt(Math.pow(2, 64));
    var hash = BigInt("0xCBF29CE484222325");
    for (var i = 0; i < str.length; i++) {
        hash ^= BigInt(str[i].charCodeAt());
        hash *= BigInt(0x100000001B3);
        hash %= uint64_max;
    }
    var shash = hash.toString(16);
    var n = 16 - shash.length;
    shash = '0'.repeat(n).concat(shash);
    return shash;
}
