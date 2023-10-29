require("dotenv").config();

const {
  getRole,
  verify,
  ex,
  printAddress,
  deploySC,
  deploySCNoUp,
} = require("../utils");
const { ethers, upgrades } = require("hardhat");
const { getRootFromMT } = require("../utils/merkleTree");

var MINTER_ROLE = getRole("MINTER_ROLE");
var BURNER_ROLE = getRole("BURNER_ROLE");

// Publicar NFT en Mumbai
async function deployMumbai() {
  var relAddMumbai = "0xDd0EB090c6d88426176513d9c5342844C885Be23"; // relayer mumbai
  var name = "CuyCollectionNft";
  var symbol = "CUYNFT";

  // utiliza deploySC
  // utiliza printAddress
  const cuyToken = await deploySC(name, [name, symbol]);
  let impCuy = await printAddress(name, await cuyToken.getAddress());
  // utiliza ex
  // var tx = await cuyToken.grantRole(MINTER_ROLE,relAddMumbai);
  // console.log('Minter role granted');
  // // utiliza ex
  // var root =getRootFromMT();
  // console.log(root)
  // tx = await cuyToken.actualizarRaiz(root);
  // utiliza verify
  await verify(impCuy,[name, symbol] );

  //await verify(implAdd, "CUYNFT");
}

// Publicar UDSC, Public Sale y Bbites Token en Goerli
async function deployGoerli() {
  var relAddGoerli = "0xc483909E8ce0B5ecc1BF5477542d11970f365c93"; // relayer goerli
  const routerAddress = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
  const bbitesAddress = "0x277c82d54D8D71eCC8E479998d3a93bFF582F819";
  const usdCoinAddress= "0xD311E7963e0e559b2F0cD8DdD2A7c27262462704";

  // var bbitesToken Contrato
  // deploySC;
  // Contrato a publicar: BBTKN
  // let bbitesArgs= ["BBitesToken", "BBTKN"];
  // console.log('Deploy BBites', bbitesArgs);
  // var bbitesToken = await deploySC("BBitesToken",bbitesArgs);
  // console.log(`Address del contrato ${await bbitesToken.getAddress()}`);
  // var impBT = await printAddress("BBitesToken", await bbitesToken.getAddress());

  // // // var usdc Contrato
  // // deploySC;
  // // Contrato a publicar: USDCoin
  // var usdCoin = await deploySCNoUp("USDCoin");
  // console.log(`Address del contrato ${await usdCoin.getAddress()}`);

  // var psC Contrato
  // deploySC;
  // Contrato a publicar: PublicSale
  var publicSale = await deploySC("PublicSale",[bbitesAddress,usdCoinAddress, routerAddress]);
  console.log(`Address del contrato ${await publicSale.getAddress()}`);
  var impPS = await printAddress("PublicSale", await publicSale.getAddress());

  // await publicSale.grantRole(MINTER_ROLE,relAddGoerli);
  // console.log('Minter role granted')

  // script para verificacion del contrato
  // await verify(impBT,"BBitesToken");
  await verify(impPS, "PublicSale");
}

async function verifyContracts(){
  const usdcaddress = "0xD311E7963e0e559b2F0cD8DdD2A7c27262462704";
  const publicSaleAdd= "0x2f20fe62A605cfedD791d8BFF25b68A3F3BB3cAF"
  await verify(publicSaleAdd, "PublicSale");
}

async function upgrade() {
  const PSProxyAddress = "0x38E509A1e9d3120db0686D3D4B959d586541733f";
  const PublicSaleV2 = await ethers.getContractFactory(
    "PublicSale"
  );
  const psV2 = await upgrades.upgradeProxy(
    PSProxyAddress,
    PublicSaleV2
  );

  var implV2 = await upgrades.erc1967.getImplementationAddress(PSProxyAddress);
  console.log(`Address Proxy: ${PSProxyAddress}`);
  console.log(`Address Impl V2: ${implV2}`);

  await hre.run("verify:verify", {
    address: implV2,
    constructorArguments: [],
  });
}

async function main() {
  // Get the network name from Hardhat
  const network = hre.network.name;
  if (network === 'mumbai') {
      await deployMumbai();
  } else if (network === 'goerli') {
      //await deployGoerli();
      await verifyContracts();
      //await upgrade();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
