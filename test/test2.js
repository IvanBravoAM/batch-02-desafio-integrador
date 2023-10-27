var { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
var { expect } = require("chai");
const { ethers, upgrades } = require('hardhat');

var { time } = require("@nomicfoundation/hardhat-network-helpers");

const { getRole, deploySC, deploySCNoUp, ex, pEth } = require("../utils");

const MINTER_ROLE = getRole("MINTER_ROLE");
const BURNER_ROLE = getRole("BURNER_ROLE");

// 00 horas del 30 de septiembre del 2023 GMT
var startDate = 1696032000;

let PublicSale;

describe("Public Sale Testing 2", function () {

    let USDCoin_CONTRACT;
    let BBitesTOKEN_CONTRACT;
    let PublicSale_CONTRACT;

    

    before(async () => {
        [owner, alice, bob, carl, admin] = await ethers.getSigners();

        const uniswapRouter = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

        //DEPLOY USDCOIN
        const USDCoin = await ethers.getContractFactory("USDCoin");
        USDCoin_CONTRACT = await USDCoin.deploy();
        await USDCoin_CONTRACT.waitForDeployment();

        //!DEPLOY BBITES TOKEN
        const BBitesToken = await ethers.getContractFactory('BBitesToken');
        BBitesTOKEN_CONTRACT = await upgrades.deployProxy(
            BBitesToken,
            ["BBitesToken",
            "BBTKN"]
        );
        await BBitesTOKEN_CONTRACT.waitForDeployment();

        //DEPLOY PUBLIC SALE
        const contract = await ethers.getContractFactory("PublicSale");
        PublicSale_CONTRACT = await upgrades.deployProxy(
            contract,
            [await BBitesTOKEN_CONTRACT.getAddress(), await USDCoin_CONTRACT.getAddress(), uniswapRouter]
        );
        await PublicSale_CONTRACT.waitForDeployment();

    
            
    });

    context('TESTS', async() => {

        it('[0] -> Deploys ', async() => {

        })

        it('[1] -> ', async() => {

        })

        it('[2]', async() => {
            
        })

        it('[3]', async() => {
            
        })

        it('[4]', async() => {
            
        })

        it('[5] -> Withdraw Ether', async() => {

            await alice.sendTransaction({
                to: PublicSale_CONTRACT,
                value: ethers.parseEther("0.01")
            });

            console.log(await PublicSale_CONTRACT.hasRole(await PublicSale_CONTRACT.DEFAULT_ADMIN_ROLE(), owner.address));
            
            let tx = await PublicSale_CONTRACT.connect(owner).withdrawEther();
            console.log(tx);
            /*await expect(tx).changeEtherBalances(
                [owner.address, await _publicSale.getAddress()],
                [ethers.parseEther("0.01"), ethers.parseEther("-0.01")]
            );*/
        })

        it('[6]', async() => {
            
        })

        it('[7]', async() => {
            
        })

    })

})