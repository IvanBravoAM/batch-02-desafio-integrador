var { ethers } = require("hardhat");
var pEth = ethers.parseEther;

// TOKEN A: 0x86d02251E5a05E87309a787230208dB9dFcB42FA
// TOKEN B: 0xbf227f4d07aaF798f49f7D97C36b79e9E67fE050
async function deployTokens() {
  var tokenA = await ethers.deployContract("TokenA");
  console.log("Contract TokenA address:", await tokenA.getAddress());

  var tokenB = await ethers.deployContract("TokenB");
  console.log("Contract TokenB address:", await tokenB.getAddress());

  var resA = await tokenA.waitForDeployment();
  var resB = await tokenB.waitForDeployment();
  await resA.deploymentTransaction().wait(5);
  await resB.deploymentTransaction().wait(5);

  await hre.run("verify:verify", {
    address: await tokenA.getAddress(),
    constructorArguments: [],
    contract: "contracts/class14/Tokens.sol:TokenA",
  });

  await hre.run("verify:verify", {
    address: await tokenB.getAddress(),
    constructorArguments: [],
    contract: "contracts/class14/Tokens.sol:TokenB",
  });
}

// Contrato LiquidityProvider: 0x8FbD48Ed31A27ebaa5AeDcC0a44d2e189cd0749a
async function publicarContratoLiquidity() {
  var liquidityProvider = await ethers.deployContract("LiquidityProvider");
  console.log(
    "Contract LiquidityProvider address:",
    await liquidityProvider.getAddress()
  );

  var res = await liquidityProvider.waitForDeployment();
  await res.deploymentTransaction().wait(5);

  await hre.run("verify:verify", {
    address: await liquidityProvider.getAddress(),
    constructorArguments: [],
    contract: "contracts/class14/Tokens.sol:TokenA",
  });
}

var pEth = ethers.parseEther;
async function proveerLiquidez() {
  var [owner] = await ethers.getSigners();

  var tokenAAdd = "0x86d02251E5a05E87309a787230208dB9dFcB42FA";
  var TokenA = await ethers.getContractFactory("TokenA");
  var tokenA = TokenA.attach(tokenAAdd);

  var tokenBAdd = "0xbf227f4d07aaF798f49f7D97C36b79e9E67fE050";
  var TokenB = await ethers.getContractFactory("TokenB");
  var tokenB = TokenB.attach(tokenBAdd);

  var loquidityProviderAdd = "0x8FbD48Ed31A27ebaa5AeDcC0a44d2e189cd0749a";
  var LiquidityProv = await ethers.getContractFactory("LiquidityProvider");
  var liquidityProv = LiquidityProv.attach(loquidityProviderAdd);

  // parseEther: al numero agregale 18 ceros
  console.log("acuniando");
  var tx = await tokenA.mint(loquidityProviderAdd, pEth("200"));
  console.log("acuniando 2");
  await tx.wait();
  tx = await tokenB.mint(loquidityProviderAdd, pEth("100"));
  await tx.wait();

  console.log("liquidez");
  var _tokenA = tokenAAdd;
  var _tokenB = tokenBAdd;
  var _amountADesired = pEth("200");
  var _amountBDesired = pEth("100");
  var _amountAMin = pEth("200");
  var _amountBMin = pEth("100");
  var _to = owner.address;
  var _deadline = new Date().getTime() + 60000;

  tx = await liquidityProv.addLiquidity(
    _tokenA,
    _tokenB,
    _amountADesired,
    _amountBDesired,
    _amountAMin,
    _amountBMin,
    _to,
    _deadline
  );
  var res = await tx.wait();
  console.log(`Hash de la transaction ${res.hash}`);
}

async function publicarSwapper() {
  var swapper = await ethers.deployContract("Swapper");
  console.log("Contract Swapper address:", await swapper.getAddress());

  var res = await swapper.waitForDeployment();
  await res.deploymentTransaction().wait(5);
}

async function swapExactTokensForTokens() {
  var [owner] = await ethers.getSigners();

  var tokenAAdd = "0x86d02251E5a05E87309a787230208dB9dFcB42FA";
  var TokenA = await ethers.getContractFactory("TokenA");
  var tokenA = TokenA.attach(tokenAAdd);

  var tokenBAdd = "0xbf227f4d07aaF798f49f7D97C36b79e9E67fE050";
  var TokenB = await ethers.getContractFactory("TokenB");
  var tokenB = TokenB.attach(tokenBAdd);

  var swapperAdd = "0x0A5e44C07b189662269cd715D5a65Ba4075a3Ef3";
  var Swapper = await ethers.getContractFactory("Swapper");
  var swapper = Swapper.attach(swapperAdd);

  var lpAdd = "0x8FbD48Ed31A27ebaa5AeDcC0a44d2e189cd0749a";

  //   var tx = await tokenB.mint(swapperAdd, pEth("20"));
  //   await tx.wait();

  //   var _amountIn = pEth("20");
  //   var _amountOutMin = pEth("20");
  //   var _path = [tokenBAdd, tokenAAdd];
  //   var _to = swapperAdd;
  //   var _deadline = new Date().getTime() + 60000;
  //   tx = await swapper.swapExactTokensForTokens(
  //     _amountIn,
  //     _amountOutMin,
  //     _path,
  //     _to,
  //     _deadline
  //   );
  //   var res = await tx.wait();
  //   console.log(res.hash);

  // Bal Swap A: 33249958312489578122
  // Bal Swap B: 0
  // Bal LP A: 200000000000000000000
  // Bal LP B: 0

  console.log(`Bal Swap A: ${(await tokenA.balanceOf(swapperAdd)).toString()}`);
  console.log(`Bal Swap B: ${(await tokenB.balanceOf(swapperAdd)).toString()}`);
  console.log(`Bal LP A: ${(await tokenA.balanceOf(lpAdd)).toString()}`);
  console.log(`Bal LP B: ${(await tokenB.balanceOf(lpAdd)).toString()}`);
}

async function swapTokensForExactTokens() {
  var [owner] = await ethers.getSigners();

  var tokenAAdd = "0x86d02251E5a05E87309a787230208dB9dFcB42FA";
  var TokenA = await ethers.getContractFactory("TokenA");
  var tokenA = TokenA.attach(tokenAAdd);

  var tokenBAdd = "0xbf227f4d07aaF798f49f7D97C36b79e9E67fE050";
  var TokenB = await ethers.getContractFactory("TokenB");
  var tokenB = TokenB.attach(tokenBAdd);

  var swapperAdd = "0x0A5e44C07b189662269cd715D5a65Ba4075a3Ef3";
  var Swapper = await ethers.getContractFactory("Swapper");
  var swapper = Swapper.attach(swapperAdd);

  var lpAdd = "0x8FbD48Ed31A27ebaa5AeDcC0a44d2e189cd0749a";
  // Balance de Swapper (lo que tenemos)
  // Token A Bal:  33249958312489578122
  // Token B Bal:  0

  // Balance Liquidity Pool
  // Token A Bal:  166750041687510421878 ~ 166 A
  // Token B Bal:  120000000000000000000 ~ 120 B

  // El ratio de tokens A a tokens B es 2:1
  // Vamos a solicitar la cantidad exacta de 10 tokens B (porque tenemos tokens A)
  // No sabemos cuantos tokens B necesitamos para obtener 10 tokens A
  // Atravès del liquidity pool, se intercambirá los tokens A por tokens B

  //   A       B              A        B     B
  // (166) * (120) = K = (166 + X) * (120 - 10)
  // 19920 = (166 + X) * (110)
  // X ~ 15

  // Enviar tokens A al contrato Swapper
  var amountOut = pEth("10"); // 10 tokens B
  var amountInMax = pEth("20"); // Aprox, estoy dispuesto a entregar 20 tokens A
  var path = [tokenAAdd, tokenBAdd];
  var to = swapperAdd;
  var deadline = new Date().getTime() + 10000;

  var tx = await swapper.swapTokensForExactTokens(
    amountOut,
    amountInMax,
    path,
    to,
    deadline
  );

  var res = await tx.wait();
  console.log("Transaction Hash", res.hash);

  console.log("Bal Swapp A: ", (await tokenA.balanceOf(swapperAdd)).toString());
  console.log("Bal Swapp B: ", (await tokenB.balanceOf(swapperAdd)).toString());
  console.log("Bal LiquP A: ", (await tokenA.balanceOf(lpAdd)).toString());
  console.log("Bal LiquP B: ", (await tokenB.balanceOf(lpAdd)).toString());
}

// deployTokens();
// publicarContratoLiquidity();
// proveerLiquidez();
// publicarSwapper();
// swapExactTokensForTokens();
swapTokensForExactTokens();
