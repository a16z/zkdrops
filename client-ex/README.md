# client-ex: React + NextJS + Webpacking
Example of computing proofs for the [zkdrops-contracts](https://github.com/a16z/zkdrops/zkdrops-contracts) sample repo in the browser. The majority of the work is done by the [zkdrops-lib](https://github.com/a16z/zkdrops/zkdrops-lib) which in turn uses the work of the iden3 team's Circom libraries. 

Proof computation takes 20-60s in the browser depending on the machine.

![Fe-ex-picture](imgs/fe-ex.png)

## Notes
This example front-end depends on the following locally served files:
- `mt_8192.txt` – Sample merkle tree from `zkdrops/zkdrops-contracts/test/data/mt_8192.txt`
- `circuit_final.zkey` – ZKey used by proof generation
- `circuit.wasm` – Circom wasm used to generate circuit proof by snarkjs

The zkdrops-lib includes imports for server-side only libraries. Because this usage is browser based, this repo ignores them during webpacking in `next.config.js`.

## Sample keys and secrets 
| key | secret |
| --- | --- |
| 0x009e6e111670ade65619330a1c34a3dc531ef3984749c9d69dea04b03a3a4f7f | 0x0078f4345cf4ecf7a0ce60629c3b830a723f5ba57654fa5b3140f75cbdcf49d4 |
| 0x00c06a7aa765bc92bab643baf757ee456f1ee890f690c09ba9a6be7533cf8e17 | 0x009968cc4b34a8a1dc99d503565c2c29707d336d877a1c5510a8679eb8398be2 |
| 0x0018491a8a8fb0348df12c944819aa152acf74f8294f769594df72163ed12974 | 0x008388a500abd0b0e1d912813a283b920d1bf479aeb16aa951132e92d5caa191 |
| 0x001db57ac6f56e91d3a8a6f888bced61de39b357ac6fe0c5d7857c2bcc660a3a | 0x0019175b472bb5285c43db00eb7065905606882bfb4857c1c8216b249443c0f7 |

*[source](https://github.com/a16z/zkdrops/zkdrops-contracts/blob/master/test/temp/mt_keys_8192.csv)*

## Adding Hardhat local dev chain to Metamask
- Click the "Networks" drop down and then click "Add Network"
- Fill out with the following settings:
![local-metamask-settings](imgs/local-metamask-settings.png)

*When using hardhat + metamsk and the local chain is rebooted, you will need to go to Settings -> Advanced -> Reset account to reset your account nonce to 0.*