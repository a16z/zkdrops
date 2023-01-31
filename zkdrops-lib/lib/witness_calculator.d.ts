declare function _exports(code: any, options: any): Promise<WitnessCalculator>;
export = _exports;
declare class WitnessCalculator {
    constructor(instance: any, sanityCheck: any);
    instance: any;
    version: any;
    n32: any;
    prime: bigint;
    witnessSize: any;
    sanityCheck: any;
    circom_version(): any;
    _doCalculateWitness(input: any, sanityCheck: any): Promise<void>;
    calculateWitness(input: any, sanityCheck: any): Promise<bigint[]>;
    calculateBinWitness(input: any, sanityCheck: any): Promise<Uint8Array>;
    calculateWTNSBin(input: any, sanityCheck: any): Promise<Uint8Array>;
}
