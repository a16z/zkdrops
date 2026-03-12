/// <reference types="node" />
/// <reference types="node" />
import { MerkleTree } from './MerkleTree';
export declare function generateProofCallData(merkleTree: MerkleTree, key: BigInt, secret: BigInt, receiverAddr: string, circuitWasmBuffer: Buffer, zkeyBuffer: Buffer): Promise<string>;
export declare function toHex(number: BigInt, length?: number): string;
