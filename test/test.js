var { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
var { expect } = require("chai");
const { ethers, upgrades } = require('hardhat');
const routerArtifact = require('@uniswap/v2-periphery/build/UniswapV2Router02.json');
var { time } = require("@nomicfoundation/hardhat-network-helpers");
const BigNumber = require("bignumber.js");

const { getRole, deploySC, deploySCNoUp, ex, pEth } = require("../utils");

const MINTER_ROLE = getRole("MINTER_ROLE");
const BURNER_ROLE = getRole("BURNER_ROLE");

// 00 horas del 30 de septiembre del 2023 GMT
var startDate = 1696032000;
const DECIMALS =10 ** 18;

describe("Public Sale Testing", function () {

    async function deployFixture() {
        const [owner, alice, bob, carl, admin] = await ethers.getSigners();
        const otherAccounts = [alice, bob, carl];

        const uniswapRouter = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
        const factoryAddress = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";

        const USDCoin = await ethers.getContractFactory("USDCoin");
        const usdCoin = await USDCoin.deploy();
        await usdCoin.waitForDeployment();

        const BBitesToken = await ethers.getContractFactory('BBitesToken');
        const bbites = await upgrades.deployProxy(
            BBitesToken,
            ["BBitesToken",
            "BBTKN"]
        );
        await bbites.waitForDeployment();

        const contract = await ethers.getContractFactory("PublicSale");
        const PublicSale = await upgrades.deployProxy(
            contract,
            [await bbites.getAddress(), await usdCoin.getAddress(), uniswapRouter]
        );
        await PublicSale.waitForDeployment();

        const LP = await ethers.getContractFactory("LiquidityProvider");
        const lp = await LP.deploy(uniswapRouter, factoryAddress, await bbites.getAddress(), await usdCoin.getAddress() );
        await lp.waitForDeployment();
        console.log('lp', await lp.getAddress())
        return { PublicSale, owner, alice, bob, carl, otherAccounts,bbites,usdCoin , admin, uniswapRouter, factoryAddress, lp};
    }
    describe("Purchase with Tokens", function () {
        var _publicSale, owner, _bbites, alice;
        beforeEach(async () => {
            const fixture = await loadFixture(deployFixture);
            _publicSale = fixture.PublicSale;
            owner = fixture.owner;
            alice = fixture.alice;
            _bbites = fixture.bbites;
            
        }); 
        it('Emit PurchasedNftWithId',async() => {
            const price = BigInt(15000 * DECIMALS);
            console.log(price);
            await _bbites.approve(owner.address, price);

            await _bbites.transferFrom(owner, alice, price);

            await _bbites.connect(alice).approve(_publicSale, price);

            var tx = await _publicSale.connect(alice).purchaseWithTokens(20);

            await expect(tx)
            .to.emit(_publicSale, "PurchaseNftWithId")
            .withArgs(alice.address, 20);
        });
    });
    describe("Purchase with USDC", function () {
        var _publicSale, owner, _bbites, alice, _usdcoin, _lp;
        beforeEach(async () => {
            const fixture = await loadFixture(deployFixture);
            _publicSale = fixture.PublicSale;
            owner = fixture.owner;
            alice = fixture.alice;
            _bbites = fixture.bbites;
            _usdcoin = fixture.usdCoin;
            _uniswap = fixture.uniswapRouter;

            _lp = fixture.lp;

            const amountA = ethers.parseEther("12000");
            const amountB = ethers.parseEther("10000");
            // Approve tokens for the Router
            await _bbites.connect(owner).approve(_uniswap, amountA);
            await _usdcoin.connect(owner).approve(_uniswap, amountB);
            var _deadline = new Date().getTime() + 60000;

            var LiquidityProv = await ethers.getContractFactory("LiquidityProvider");
            var liquidityProv = LiquidityProv.attach(await _lp.getAddress());
            // Provide liquidity

            var tx = await _bbites.mint(await _lp.getAddress(), pEth("12000"));
            console.log("acuniando 2");
            await tx.wait();
            tx = await _usdcoin.mint(await _lp.getAddress(), pEth("10000"));
            await tx.wait();

            console.log(`Bal LP A: ${(await _bbites.balanceOf(_lp.getAddress())).toString()}`);
            console.log(`Bal LP B: ${(await _usdcoin.balanceOf(_lp.getAddress())).toString()}`);

            await liquidityProv
                .connect(owner)
                .addLiquidity(_bbites, _usdcoin, amountA, amountB, 0, 0, owner.address, _deadline);
        }); 
        it('Emit PurchasedNftWithId',async() => { 
            await _usdcoin.approve(owner.address, 15000);

            await _usdcoin.transferFrom(owner, alice, 15000);

            await _usdcoin.approve(_publicSale, 15000);

            var tx = await _publicSale.connect(alice).purchaseWithUSDC(20);

            await expect(tx)
            .to.emit(_publicSale, "PurchaseNftWithId")
            .withArgs(alice.address, 20);
        });    
    });       
    describe("Purchase with Ether and Id", function () {
        var _publicSale, owner, _bbites, alice, _usdcoin; 
        beforeEach(async () => {
            const fixture = await loadFixture(deployFixture);
            _publicSale = fixture.PublicSale;
            alice = fixture.alice;
        });    
        it('Change Ether Balance and give change',async() => {
            var _id = 200;
            var aEth;
            aEth = ethers.parseEther("0.02");
            var tx = await _publicSale.connect(alice).purchaseWithEtherAndId(_id, { value: aEth });

            await expect(tx)
            .to.emit(_publicSale, "PurchaseNftWithId")
            .withArgs(alice.address, _id);

            await expect(tx).changeEtherBalances(
                [alice.address, await _publicSale.getAddress()],
                [ethers.parseEther("-0.01"), ethers.parseEther("0.01")]
            );
        });
    });
    describe("Deposit Eth For Random Nft", function () {
        var _publicSale, owner, _bbites, alice, _usdcoin; 
        beforeEach(async () => {
            const fixture = await loadFixture(deployFixture);
            _publicSale = fixture.PublicSale;
            alice = fixture.alice;
        });    
        xit('Deposit Eth and get Nft',async() => {
            var aEth;
            aEth = ethers.parseEther("0.01");
            var tx = _publicSale.connect(alice).depositEthForARandomNft({ value: aEth });
            await expect(tx).changeEtherBalances(
                [alice.address, await _publicSale.getAddress()],
                [ethers.parseEther("-0.01"), ethers.parseEther("0.01")]
            );
            // await expect(tx)
            // .to.emit(_publicSale, "PurchaseNftWithId")
            // .withArgs(alice.address, 20);
        });
        it('Send exact amount of ether',async() => {
            var aEth;
            aEth = ethers.parseEther("0.02");
            var tx = _publicSale.connect(alice).depositEthForARandomNft({ value: aEth });
            await expect(tx).to.be.revertedWith('Send exactly 0.01 ether');
        });
    });
    describe("Swap Tokens", function () {
        var _publicSale, owner, _bbites, alice, _usdcoin; 
        beforeEach(async () => {
            const fixture = await loadFixture(deployFixture);
            _publicSale = fixture.PublicSale;
            _bbites = fixture.bbites;
            _usdcoin = fixture.usdCoin;
            alice = fixture.alice;
            
        });
        it('Test swapTokensForExactTokens',async() => {
            var aEth;
            aEth = ethers.parseEther("0.02");
            const router = await new ethers.Contract(_uniswap, routerArtifact.abi, owner);

            var amountOut = pEth("10"); // 10 tokens B
            var amountInMax = pEth("20"); // Aprox, estoy dispuesto a entregar 20 tokens A
            var path = [_usdcoin.address, _bbites.address];
            var to = _publicSale.address;
            var deadline = new Date().getTime() + 10000;

            var tx = await router.swapTokensForExactTokens(
                amountOut,
                amountInMax,
                path,
                to,
                deadline
            );
            console.log('tx', tx);
            //await expect(tx).to.be.revertedWith('Send exactly 0.01 ether');
        }); 
    });
    
    describe("Withdraw Ether", function () {
        var _publicSale, owner, _bbites, alice, _usdcoin, admin; 
        beforeEach(async () => {
            const fixture = await loadFixture(deployFixture);
            _publicSale = fixture.PublicSale;
            _bbites = fixture.bbites;
            _usdcoin = fixture.usdCoin;
            alice = fixture.alice;
            owner = fixture.owner;
            admin = fixture.admin;
        });
        xit('Change balances',async() => {

            await alice.sendTransaction({
                to: _publicSale,
                value: ethers.parseEther("0.01")
            });

            tx = await _publicSale.connect(owner).withdrawEther();
            await expect(tx).changeEtherBalances(
                [owner.address, await _publicSale.getAddress()],
                [ethers.parseEther("0.01"), ethers.parseEther("-0.01")]
            );
        
        });
    });
    describe("Withdraw Tokens", function () {
        var _publicSale, owner, _bbites, alice, _usdcoin, admin; 
        beforeEach(async () => {
            const fixture = await loadFixture(deployFixture);
            _publicSale = fixture.PublicSale;
            _bbites = fixture.bbites;
            _usdcoin = fixture.usdCoin;
            alice = fixture.alice;
            owner = fixture.owner;
            admin = fixture.admin;
        });
        xit('Change token balances',async() => {
            var tx;

            await _bbites.approve(owner.address, 15000);
            await _bbites.transferFrom(owner, alice, 15000);
            await _publicSale.connect(alice).purchaseWithTokens(20);

            const adminRole = await _publicSale.DEFAULT_ADMIN_ROLE();
            await _publicSale.connect(owner).grantRole(adminRole, admin.address);

            tx = await _publicSale.connect(admin).withdrawTokens();
            expect([await _bbites.balanceOf(admin),await _bbites.balanceOf(alice)]).to.deep.equal([1000n,14000n]);
        
        });
    }); 
    describe("Get Price for ID", function () {
        var _publicSale, owner, _bbites, alice, _usdcoin, admin; 
        beforeEach(async () => {
            const fixture = await loadFixture(deployFixture);
            _publicSale = fixture.PublicSale;
            _bbites = fixture.bbites;
            _usdcoin = fixture.usdCoin;
            alice = fixture.alice;
            owner = fixture.owner;
            admin = fixture.admin;
        });
        it('Get `common` price',async() => {
            var tx;
            tx = await _publicSale.getPriceForId(20);
            const expPrice= BigInt(1000 * DECIMALS);
            await expect(tx).to.be.equal(expPrice);
        
        });
        it('Get `rare` price',async() => {
            var tx;
            const id=200;
            const expPrice = BigInt((id*20) * DECIMALS);
            tx = await _publicSale.getPriceForId(id);
            await expect(tx).to.be.equal(expPrice);
        
        });
        it('Get `legendary` price',async() => {
            var tx;
            const provider = ethers.provider; // Get the Ethereum provider
            const currentBlock = await provider.getBlock('latest'); // Get the latest block
            const currentTimestamp = currentBlock.timestamp;

            const daysPassed = (currentTimestamp - startDate)  / (60 * 60 * 24);;

            const expPrice = (10000 + Math.floor(daysPassed) * 2000) *DECIMALS;
            console.log('m', Math.floor(daysPassed) *2000);
            console.log('b', (10000 + Math.floor(daysPassed) * 2000));
            console.log('d', expPrice);
            tx =  await _publicSale.getPriceForId(500);
            console.log(tx);
            var tx2 =  Number(tx).toFixed(4);
            console.log(expPrice);
            await expect(tx).to.be.equal(expPrice);
        
        });
        it('Invalid NFT ID',async() => {
            var tx;
            tx = _publicSale.getPriceForId(700);
            await expect(tx).to.be.revertedWith('Invalid NFT ID');
        
        });
    });               
});