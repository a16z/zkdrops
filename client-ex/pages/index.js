import { MerkleTree, generateProofCallData, pedersenHashConcat, toHex, pedersenHash } from 'zkp-merkle-airdrop-lib';
import { providers, Contract, ethers, BigNumber } from 'ethers';

import * as AIRDROP_JSON from "../ABIs/PrivateAirdrop.json";
import * as ERC20_JSON from "@openzeppelin/contracts/build/contracts/ERC20PresetFixedSupply.json";

import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function IndexPage() {
  const [state, setState] = React.useState({
    key: "",
    secret: "",
    airdropAddress: "",
    erc20Address: "",
    erc20Balance: 0,
    proof: "",
    loading: false
  })

  let handleBalanceCheck = () => {
    checkErc20Balance(state.erc20Address, state, setState);
  }

  let handleCalcProof = () => {
    calculateProof(state.key, state.secret, state, setState);
  }

  let handleCollect = () => {
    collectDrop(state.key, state.airdropAddress, state, setState);
  }

  let handleLocalHostEth = () => {
    transferLocalHostEth(state, setState);
  }

  return (
    <div className="container">

      <div className="row">
        <div className="col-2"></div>
        <div className="col text-center">
          <h1>ZK Merkle Airdrop FE</h1>
        </div>
      </div>

      <div className="row mb-2">
        <div className="col-2"></div>
        <div className="col text-center">
          <button className="btn btn-success" onClick={handleLocalHostEth}>Collect some ETH</button>
        </div>
      </div>

      <div className="row justify-content-center">
        <div className="col-2"></div>
        <div className="col-8">


          <div className="card">
            <div className="card-header">
              Query Balances {state.erc20Balance}
            </div>
            <div className="card-body">
              <div className="input-group">
                <div className="input-group-prepend">
                  <div className="input-group-text">
                    ERC20 Token Address
                  </div>
                </div>
                <input
                  type="text"
                  name="erc20Address"
                  className="form-control"
                  value={state.erc20Address}
                  onChange={evt => setState({...state, [evt.target.name]: evt.target.value})}
                  />
              </div>
            </div>
            <div className="card-footer">
              <button className="btn btn-secondary" onClick={handleBalanceCheck}>Query Wallet ERC20 Balance</button>
            </div>
          </div>



          <div className="mt-3">
            <div className="card">
              <div className="card-header">
                Calculate proof and collect airdrop
              </div>

              <div className="card-body">

                <div className="input-group mt-2">
                  <div className="input-group-prepend">
                    <div className="input-group-text">
                      Key
                    </div>
                  </div>
                  <input
                    type="text"
                    name="key"
                    className="form-control"
                    value={state.key}
                    onChange={evt => setState({...state, [evt.target.name]: evt.target.value})}
                    />
                </div>

                <div className="input-group mt-2">
                  <div className="input-group-prepend">
                    <div className="input-group-text">
                     Secret 
                    </div>
                  </div>
                  <input
                    type="text"
                    name="secret"
                    className="form-control"
                    value={state.secret}
                    onChange={evt => setState({...state, [evt.target.name]: evt.target.value})}
                    />
                </div>

                <div className="input-group mt-2">
                  <div className="input-group-prepend">
                    <div className="input-group-text">
                      PrivateAirdrop Contract Address
                    </div>
                  </div>
                  <input
                    type="text"
                    name="airdropAddress"
                    className="form-control"
                    value={state.airdropAddress}
                    onChange={evt => setState({...state, [evt.target.name]: evt.target.value})}
                    />
                </div>

              </div>

              <div className="card-footer"> 
                <button className="btn btn-primary" onClick={handleCalcProof}>Calculate Proof</button>
                <button className="btn btn-warning ml-2" onClick={handleCollect}>Collect Drop</button>
              </div>
            </div>
          </div>

          {state.loading? 
            <div className="spinner-border m-5" role="status">
              {/* <span className="sr-only">Loading...</span> */}
            </div>
            :
            <p></p>
          }


          <div className="card">
            <div className="card-header">
              Proof
            </div>
            <div className="card-body">
              {state.proof === ''?
                <div>
                  No proof calculated
                </div> 
              :
                <div>
                  {state.proof}
                </div>
              }
            </div>
          </div>


        </div>
        <div className="col-4"></div>
      </div>
    </div>
  )
}

async function calculateProof(key, secret, state, setState) {
  if (state.key === '' || state.secret === '')  {
    alert("Either key or secret are missing!")
    return
  }
  setState({...state, loading:true})

  // Connect to wallet, get address
  let provider = new providers.Web3Provider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  let signer = provider.getSigner();
  let address = await signer.getAddress();

  // Compute a commitment locally
  let computedCommitment = toHex(pedersenHashConcat(BigInt(key), BigInt(secret)));

  // Load files and run proof locally
  let DOMAIN = "http://localhost:3000";
  let mtSs = await getFileString(`${DOMAIN}/mt_8192.txt`);
  let wasmBuff = await getFileBuffer(`${DOMAIN}/circuit.wasm`);
  let zkeyBuff = await getFileBuffer(`${DOMAIN}/circuit_final.zkey`);

  // Load the Merkle Tree locally
  let mt = MerkleTree.createFromStorageString(mtSs);
  if (!mt.leafExists(BigInt(computedCommitment))) {
    alert("Leaf corresponding to (key,secret) does not exist in MerkleTree.");
    setState({...state, loading:false})
    return;
  }
  
  let preTime = new Date().getTime();
  let proof = await generateProofCallData(mt, BigInt(key), BigInt(secret), address, wasmBuff, zkeyBuff);
  let elapsed =  new Date().getTime() - preTime;
  console.log(`Time to compute proof: ${elapsed}ms`);

  setState({...state, proof: proof, loading:false})
}

async function collectDrop(key, airdropAddr, state, setState) {
  if (state.proof === '') {
    alert("No proof calculated yet!")
    return
  }
  if (state.airdropAddress === '') {
    alert("No airdrop address entered!")
    return
  }
  setState({...state, loading:true})

  let provider = new providers.Web3Provider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  let contract = new Contract(airdropAddr, AIRDROP_JSON.abi, provider.getSigner());
  let keyHash = pedersenHash(BigInt(key));

  try {
    let tx = await contract.collectAirdrop(state.proof, toHex(keyHash));
    await tx.wait()
  } catch (error) {
    alert("Airdrop collection failed: " + error['data']['message'])
  }

  setState({...state, loading:false})
}

async function checkErc20Balance(erc20Addr, state, setState) {
  if (state.erc20Address === '') {
    alert("No ERC20 address entered!")
    return
  }
  setState({...state, loading:true})

  let provider = new providers.Web3Provider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  let contract = new Contract(erc20Addr, ERC20_JSON.abi, provider).connect(provider);
  let recieverAddress = await provider.getSigner().getAddress()
  let balance = await contract.balanceOf(recieverAddress);

  console.log("ERC20 balance: ", balance.toString());
  setState({...state, erc20Balance: balance.toNumber(), loading:false})
}

let HARDHAT_DEFAULT_PK = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
async function transferLocalHostEth(state, setState) {
  setState({...state, loading:true})
  let walletProvider = new providers.Web3Provider(window.ethereum);
  await walletProvider.send('eth_requestAccounts', []);
  let walletAddress = await walletProvider.getSigner().getAddress()
  
  let hardhatWallet = new ethers.Wallet(HARDHAT_DEFAULT_PK, walletProvider)
  let value = BigNumber.from(10).pow(BigNumber.from(18))
  let tx = await hardhatWallet.sendTransaction({value: value, to: walletAddress})
  await tx.wait()
  setState({...state, loading:false})
}

async function getFileString(filename) {
  let req = await fetch(filename);
  return await req.text();
}
async function getFileBuffer(filename) {
  let req = await fetch(filename);
  return Buffer.from(await req.arrayBuffer());
}
