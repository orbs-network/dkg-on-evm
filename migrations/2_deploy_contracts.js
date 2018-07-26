var ecOpsLib = artifacts.require("./ecOps.sol");
var dkg = artifacts.require("./dkg.sol");

const n = 2;
const t = 1;
const deposit = 10 * Math.pow(10,18);

module.exports = function(deployer) {
  deployer.deploy(ecOpsLib);
  deployer.link(ecOpsLib, dkg);
  deployer.deploy(dkg, t,n, deposit);
};
