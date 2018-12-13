var ecOpsLib = artifacts.require("./ecOps.sol");
var dkg = artifacts.require("./dkg_OPT.sol");
const params = require('../test/testsData/params.js');


const n = params.n;
const t = params.t;
const deposit = 10 * Math.pow(10,18);

module.exports = function(deployer) {
  deployer.deploy(ecOpsLib);
  deployer.link(ecOpsLib, dkg);
  deployer.deploy(dkg, t,n, deposit);
};
