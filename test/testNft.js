var { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
var { expect } = require("chai");
const { ethers, upgrades, network } = require('hardhat');
const { MerkleTree } = require("merkletreejs");
const walletAndIds = require("../wallets/walletList")
const {construyendoPruebas, construyendoMerkleTree, getRootFromMT} = require("../utils/merkleTree");
var { time } = require("@nomicfoundation/hardhat-network-helpers");

const { getRole, deploySC, deploySCNoUp, ex, pEth } = require("../utils");

const MINTER_ROLE = getRole("MINTER_ROLE");
const BURNER_ROLE = getRole("BURNER_ROLE");

// 00 horas del 30 de septiembre del 2023 GMT
var startDate = 1696032000;

describe("Cuy Collection Nft Testing", function () {
    async function deployFixture() {
        const [owner, alice, bob, carl, admin] = await ethers.getSigners();
        const otherAccounts = [alice, bob, carl];

        const CuyCollection = await ethers.getContractFactory('CuyCollectionNft');
        const cuyNft = await upgrades.deployProxy(
            CuyCollection,
            ["CuyCollection",
            "CUYNFT"]
        );
        await cuyNft.waitForDeployment();

        return {  owner, alice, bob, carl, otherAccounts,cuyNft, admin};
    }
    describe("Safe mint", function () {
        var _publicSale, owner, _cuyNft, alice;
        beforeEach(async () => {
            const fixture = await loadFixture(deployFixture);
            owner = fixture.owner;
            alice = fixture.alice;
            _cuyNft = fixture.cuyNft;
            
        }); 
        it('Minted nft',async() => {
            // console.log(await _cuyNft.balanceOf(owner.address));

            const _id = 100;
            const minterRole = await _cuyNft.MINTER_ROLE();
            await _cuyNft.grantRole(minterRole, owner.address);
            var tx = await _cuyNft.connect(owner).safeMint(alice.address, _id);

            const ownerOfToken = await _cuyNft.ownerOf(_id);
            expect(ownerOfToken).to.equal(alice.address);
        });
        it('Invalid nft Id',async() => {
            // console.log(await _cuyNft.balanceOf(owner.address));

            const _id = 1000;
            const minterRole = await _cuyNft.MINTER_ROLE();
            await _cuyNft.grantRole(minterRole, owner.address);
            var tx = _cuyNft.connect(owner).safeMint(alice.address, _id);

            await expect(tx).to.be.revertedWith("Wrong token ID");
        });
    });
    describe("Buy back", function () {
        var _publicSale, owner, _cuyNft, alice;
        beforeEach(async () => {
            const fixture = await loadFixture(deployFixture);
            owner = fixture.owner;
            alice = fixture.alice;
            _cuyNft = fixture.cuyNft;
            construyendoMerkleTree()
            const root = getRootFromMT();
            await _cuyNft.actualizarRaiz(root);

        }); 
        it('Emit Burn event',async() => {

            const wallet = walletAndIds[0];
            let pruebas = await construyendoPruebas(wallet.id, wallet.address);
            await _cuyNft.connect(owner).safeMintWhiteList(wallet.address, wallet.id, pruebas);

            const signer = new ethers.Wallet(wallet.privateKey, ethers.provider);
            await network.provider.send("hardhat_setBalance", [wallet.address, `0x${ethers.parseEther("0.1").toString(16)}`]);
            var tx = _cuyNft.connect(signer).buyBack(wallet.id);
            await expect(tx).to.emit(_cuyNft, "Burn").withArgs(wallet.address, wallet.id);
        
            
        });
        it('Nft id out of range',async() => {
                const _id = 2000;
                var tx = _cuyNft.connect(owner).buyBack(_id);
                await expect(tx).to.be.revertedWith(
                    "NFT out of range."
                );
            
        });
    });
    describe("Merkle tree", function () {
        var _publicSale, owner, _cuyNft, alice;
        beforeEach(async () => {
            const fixture = await loadFixture(deployFixture);
            owner = fixture.owner;
            alice = fixture.alice;
            _cuyNft = fixture.cuyNft;
            construyendoMerkleTree()
            const root = getRootFromMT();
            await _cuyNft.actualizarRaiz(root);
            console.log(root);
        }); 
        xit('Verify proofs for all Whitelist wallets',async() => {
            for (var [i, wallet] of walletAndIds.entries()) {

                let pruebas = construyendoPruebas(wallet.id, wallet.address);
                await _cuyNft.connect(owner).safeMintWhiteList(wallet.address, wallet.id, pruebas);

                var ownerOfToken = await _cuyNft.ownerOf(wallet.id)
                expect(ownerOfToken).to.be.equal(wallet.address);
            }
            
        });
        it('Verify wrong proofs',async() => {

            const id = 1548;
            const address = "0x351fd3e20e7dbd02a762d77ad13e796746b26dc0";
            let pruebas = construyendoPruebas(id, address);
            let tx = _cuyNft.connect(owner).safeMintWhiteList(address, id, pruebas);

            await expect(tx).to.be.revertedWith(
                "No eres parte de la lista"
            );
        });
    });
    
});
