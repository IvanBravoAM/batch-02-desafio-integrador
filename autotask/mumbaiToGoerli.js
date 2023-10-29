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
    ev.signature.includes("Burn")
  );
  // Mismos params que en el evento
  var { account, id } = event[0].params;

  // Ejecutar 'mint' en Goerli del contrato BBitesToken
  var BBitesAdd = "0x277c82d54D8D71eCC8E479998d3a93bFF582F819";
  var BBitesAbi = ["function mint(address to, uint256 amount)"];
  var BBitesContract = new ethers.Contract(BBitesAdd, BBitesAbi, signer);
  var amount = BigInt(10000 * 10 ** 18);
  var tx = await BBitesContract.mint(account, amount);
  var res = await tx.wait();
  return res;
};
