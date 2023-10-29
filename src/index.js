import { Contract, ethers } from "ethers";

import usdcTknAbi from "../artifacts/contracts/USDCoin.sol/USDCoin.json";
import bbitesTokenAbi from "../artifacts/contracts/BBitesToken.sol/BBitesToken.json";
import publicSaleAbi from "../artifacts/contracts/PublicSale.sol/PublicSale.json";
import nftTknAbi from "../artifacts/contracts/CuyCollectionNft.sol/CuyCollectionNft.json";

// SUGERENCIA: vuelve a armar el MerkleTree en frontend
// Utiliza la libreria buffer
import buffer from "buffer/";
import walletAndIds from "../wallets/walletList";
import { MerkleTree } from "merkletreejs";
var Buffer = buffer.Buffer;
var merkleTree, root;

function hashToken(tokenId, account) {
  return Buffer.from(
    ethers
      .solidityPackedKeccak256(["uint256", "address"], [tokenId, account])
      .slice(2),
    "hex"
  );
}
function buildMerkleTree() {
  let hash;
  var elementosHasheados = walletAndIds.map(({ id, address }) => {
    hash = hashToken(id, address);
    return hash;
  });
  merkleTree = new MerkleTree(elementosHasheados, ethers.keccak256, {
    sortPairs: true,
  });

  root = merkleTree.getHexRoot();

  console.log(root);
}

var provider, signer, account;
var usdcTkContract, bbitesTknContract, pubSContract, nftContract;
var usdcAddress, bbitesTknAdd, pubSContractAdd;

function initSCsGoerli() {


  usdcAddress = "0xD311E7963e0e559b2F0cD8DdD2A7c27262462704";
  bbitesTknAdd = "0x277c82d54D8D71eCC8E479998d3a93bFF582F819";
  pubSContractAdd = "0x38E509A1e9d3120db0686D3D4B959d586541733f";

  usdcTkContract = new Contract(usdcAddress,usdcTknAbi.abi, provider);
  bbitesTknContract = new Contract(bbitesTknAdd, bbitesTokenAbi.abi,provider);
  pubSContract = new Contract(pubSContractAdd, publicSaleAbi.abi, provider);
}

function initSCsMumbai() {
  provider = new ethers.BrowserProvider(window.ethereum);

  var nftAddress = "0x97454e9FBB93eade7f3305AEA90e46969c57b7dc";

  nftContract = new Contract(nftAddress, nftTknAbi.abi, provider);
}

function setUpMetamask(){
  provider = new ethers.BrowserProvider(window.ethereum);
  // Connect to Metamask
  var bttn = document.getElementById("connect");
  var walletIdEl = document.getElementById("walletId");
  bttn.addEventListener("click", async function () {
    if (window.ethereum) {
      [account] = await ethereum.request({
        method: "eth_requestAccounts",
      });
      console.log("Billetera metamask", account);
      walletIdEl.innerHTML = account;
      signer = await provider.getSigner(account);
    }
    currentNetworkId = await ethereum.request({ method: 'net_version' });
  });
}
function setUpListeners() {
  
  // USDC Balance - balanceOf
  var bttn = document.getElementById("usdcUpdate");
  bttn.addEventListener("click", async function () {
    var balance = await usdcTkContract.balanceOf(account);
    var balanceEl = document.getElementById("usdcBalance");
    balanceEl.innerHTML = ethers.formatUnits(balance, 6);
  });

  // Bbites token Balance - balanceOf
  var bttn = document.getElementById("bbitesTknUpdate");
  bttn.addEventListener("click", async function () {
    var balance = await bbitesTknContract.balanceOf(account);
    var balanceEl = document.getElementById("bbitesTknBalance");
    balanceEl.innerHTML = ethers.formatUnits(balance, 18);
  });

  // APPROVE BBTKN
  // bbitesTknContract.approve
  var bttn = document.getElementById("approveButtonBBTkn");
  bttn.addEventListener("click", async function () {
    var approveInput = document.getElementById("approveInput")
    var amount = BigInt(approveInput.value * 10 ** 18);
    console.log(amount);
    var balance = await bbitesTknContract.connect(signer).approve(pubSContractAdd,amount );
    console.log(balance);
  });

  // APPROVE USDC
  // usdcTkContract.approve
  var bttn = document.getElementById("approveButtonUSDC");
  bttn.addEventListener("click", async function () {
    var approveInput = document.getElementById("approveInputUSDC")
    var amount = BigInt(approveInput.value * 10 ** 6);
    console.log(amount);
    try{
        var balance = await usdcTkContract.connect(signer).approve(pubSContractAdd,amount );
            console.log(balance);
    } catch (error) {
      var span = document.getElementById("approveErrorUSDC");
      span.value = error.reason;
    }
    
  });

  //Get USDC Amount
  var bttn = document.getElementById("calculateButtonUsdc");
  bttn.addEventListener("click", async function () {
    var approveInput = document.getElementById("calculateInput")
    var amount = BigInt(approveInput.value * 10 ** 18);
    console.log(amount);
    try{
        var balance = await pubSContract.getUSDCAmount(amount);
        console.log(balance);
        var calculateEl = document.getElementById("usdcTknAmount");    
        calculateEl.innerHTML = balance;    
    } catch (error) {
      var span = document.getElementById("calculateError");
      span.value = error.reason;
    }
    
  });

  // purchaseWithTokens
  var bttn = document.getElementById("purchaseButton");
  bttn.addEventListener("click", async function () {
    var purchaseInput = document.getElementById("purchaseInput")
    try{
        var tx = await pubSContract.connect(signer).purchaseWithTokens(purchaseInput.value );
        console.log(tx);
    } catch (error) {
      var span = document.getElementById("purchaseError");
      span.value = error.reason;
    }
    
  });

  // purchaseWithUSDC
  var bttn = document.getElementById("purchaseButtonUSDC");
  bttn.addEventListener("click", async function () {
    var purchaseInput = document.getElementById("purchaseInputUSDC");
    console.log(purchaseInput.value)
    try{
        var tx = await pubSContract.connect(signer).purchaseWithUSDC(purchaseInput.value );
        console.log(tx);
    } catch (error) {
      var span = document.getElementById("purchaseErrorUSDC");
      span.value = error.reason;
    }
    
  });

  // purchaseWithEtherAndId
  var bttn = document.getElementById("purchaseButtonEtherId");
  bttn.addEventListener("click", async function () {
    var purchaseInputEtherId = document.getElementById("purchaseInputEtherId");
    console.log(purchaseInputEtherId.value);
    try{
        var tx = await pubSContract.connect(signer).purchaseWithEtherAndId(purchaseInputEtherId.value, {value:ethers.parseEther("0.01")});
        var span = document.getElementById("purchaseEtherIdError");
        span.value = tx.message;
    } catch (error) {
      var span = document.getElementById("purchaseEtherIdError");
      span.value = error.reason;
    }
    
  });

  // send Ether
  var bttn = document.getElementById("sendEtherButton");
  bttn.addEventListener("click", async function () {
    try{
        var tx = await signer.sendTransaction({
          to: pubSContractAdd,
          value: ethers.parseEther("0.01")
        });
        span.value = tx.message;
    } catch (error) {
      var span = document.getElementById("sendEtherError");
      span.value = error.reason;
    }
    
  });

  // getPriceForId
  var bttn = document.getElementById("getPriceNftByIdBttn");
  bttn.addEventListener("click", async function () {
    var priceNftIdInput = document.getElementById("priceNftIdInput");
    console.log(priceNftIdInput.value);
    try{
        var tx = await pubSContract.getPriceForId(priceNftIdInput.value);
        priceNftByIdText.innerHTML = ethers.formatUnits(tx, 18);
    } catch (error) {
      var span = document.getElementById("sendEtherError");
      span.value = error.reason;
    }
    
  });
  // getProofs
  var bttn = document.getElementById("getProofsButtonId");
  bttn.addEventListener("click", async () => {
    var id = document.getElementById("inputIdProofId").value;
    var address =document.getElementById("inputAccountProofId").value;
    var proofs = merkleTree.getHexProof(hashToken(id, address));
    navigator.clipboard.writeText(JSON.stringify(proofs));
  });

  // safeMintWhiteList
  var bttn = document.getElementById("safeMintWhiteListBttnId");
  bttn.addEventListener("click", async () => {
    var id = document.getElementById("whiteListToInputId").value;
    console.log(id);
    var tokenId = document.getElementById("whiteListToInputTokenId").value;
    console.log(tokenId);
    // usar ethers.hexlify porque es un array de bytes
    var proofs = document.getElementById("whiteListToInputProofsId").value;
    proofs = JSON.parse(proofs).map(ethers.hexlify);
    console.log(proofs)
    try{
      var tx = await nftContract.connect(signer).safeMintWhiteList(id, tokenId, proofs);
    } catch (error) {
      var span = document.getElementById("whiteListErrorId");
      span.value = error.reason;
    }
  });

  // buyBack
  var bttn = document.getElementById("buyBackBttn");
  bttn.addEventListener("click", async function () {
    var buyBackInputId = document.getElementById("buyBackInputId");
    console.log(buyBackInputId.value);
    try{
        var tx = await nftContract.connect(signer).buyBack(buyBackInputId.value);
        console.log(tx);
    } catch (error) {
      var span = document.getElementById("buyBackErrorId");
      span.value = error.reason;
    }
    
  });
}

function setUpEventsContracts() {
  var pubSList = document.getElementById("pubSList");
  pubSContract.on("PurchaseNftWithId", (address, id) =>{
    console.log(address);
    console.log(JSON.stringify(id));
    pubSList.textContent ="Purchase Nft From: " + JSON.stringify(address)+ " With Id: "+
    JSON.stringify(id);
  });
  //Approval(owner, spender, amount);
  var approvalList = document.getElementById("appList");
  bbitesTknContract.on("Approval", (owner, spender, amount) =>{
    approvalList.textContent ="Owner: " + JSON.stringify(owner)+ " Spender: "+
    JSON.stringify(spender)+
    " Amount: "
    JSON.stringify(BigInt(amount));
  });

  var bbitesListEl = document.getElementById("bbitesTList");
  bbitesTknContract.on("Transfer", (from, to, amount) =>{
    bbitesListEl.textContent ="Transfer Event From: " + JSON.stringify(from)+ " To: "+
    JSON.stringify(to)+
    " Id: "
    JSON.stringify(BigInt(amount));
  });

  var nftList = document.getElementById("nftList");
  nftContract.on("Transfer", (from, to , id)=>{
    console.log(from);
    console.log(JSON.stringify(id));
    nftList.textContent ="Transfer Event From: " + JSON.stringify(from)+ " To: "+
    JSON.stringify(to)+
    " Id: "
    JSON.stringify(id.toString());
  })

  var burnList = document.getElementById("burnList");
  nftContract.on("Burn", (from, id)=>{
    burnList.textContent ="Burn Event From: " + JSON.stringify(from)+
    " Id: "
    JSON.stringify(id.toString());
  });
}

async function setUp() {
  window.ethereum.on("chainChanged", (chainId) => {
    window.location.reload();
  });

  
  setUpMetamask();
  buildMerkleTree();
  initSCsMumbai();
  initSCsGoerli();
  setUpListeners();
  setUpEventsContracts();

  
}

setUp()
  .then()
  .catch((e) => console.log(e));
