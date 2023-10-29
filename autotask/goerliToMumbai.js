const { ethers } = require("ethers");
const {
  DefenderRelaySigner,
  DefenderRelayProvider,
} = require("@openzeppelin/defender-relay-client/lib/ethers");

exports.handler = async function (data) {
  const payload = data.request.body.events;

  const provider = new DefenderRelayProvider(data);
  const signer = new DefenderRelaySigner(data, provider, { speed: "fast" });

  // Filtrando solo eventos
  var onlyEvents = payload[0].matchReasons.filter((e) => e.type === "event");
  if (onlyEvents.length === 0) return;

  // Filtrando solo MintInAnotherChain
  var event = onlyEvents.filter((ev) =>
    ev.signature.includes("PurchaseNftWithId")
  );
  // Mismos params que en el evento
  var { account, id } = event[0].params;

  // Ejecutar 'safeMint' en Mumbai del contrato CuyCollectionNft
  var cuyNftAdd = "0x97454e9FBB93eade7f3305AEA90e46969c57b7dc";
  var cuyNftAbi = ["function safeMint(address to, uint256 cuyNftId)"];
  var cuyNftContract = new ethers.Contract(cuyNftAdd, cuyNftAbi, signer);
  var tx = await cuyNftContract.safeMint(account, id);
  var res = await tx.wait();
  return res;
};
