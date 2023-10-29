const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");
const { ethers } = require("hardhat");
const walletAndIds = require("../wallets/walletList");
const wall = require("../wallets/w");

var merkleTree, root;
function hashToken(tokenId, account) {
  return Buffer.from(
    ethers
      .solidityPackedKeccak256(["uint256", "address"], [tokenId, account])
      .slice(2),
    "hex"
  );
}
var merkleTree, root;
function getRootFromMT() {
  if(!root){construyendoMerkleTree();}
  return root;
}

function construyendoMerkleTree() {
  let hash;
  var elementosHasheados = walletAndIds.map(({ id, address }) => {
    hash = hashToken(id, address);
    return hash;
  });
  merkleTree = new MerkleTree(elementosHasheados, keccak256, {
    sortPairs: true,
  });

  root = merkleTree.getHexRoot();
}

var hasheandoElemento, pruebas;
function construyendoPruebas(_id, _address) {
  var tokenId = _id;
  var account = _address;
  hasheandoElemento = hashToken(tokenId, account);
  pruebas = merkleTree.getHexProof(hasheandoElemento);

  // verificacion off-chain
  var pertenece = merkleTree.verify(pruebas, hasheandoElemento, root);
  return pruebas;

}

construyendoMerkleTree();
const proof = construyendoPruebas(1001, "0xBA3bf4CA212F841970ca38EA28117aDb6F881Aa9");
let encodedData = '0x'; // Start with '0x' for a hex string
for (const value of proof) {
  encodedData += value.slice(2); // Remove '0x' prefix and concatenate
}
module.exports = { getRootFromMT,construyendoMerkleTree,construyendoPruebas };
