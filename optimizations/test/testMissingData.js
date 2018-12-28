const dkg = artifacts.require("./dkg_OPT.sol");
const util = require('util');
const general = require('./dkg/general.js');
const happyFlow = require('./dkg/happyFlow.js');

const params = require('../test/testsData/params.js');
const n = params.n;
const t = params.t;

const complaintData = require(
    util.format('./testsData/t%sn%s/pubPrivComplaintData.js', t,n));

    async function postDeploy() {
        let instance = await dkg.deployed();
        await happyFlow.postDeploy(instance, complaintData.params);
    }
    
    async function join(accounts) {
        let instance = await dkg.deployed();
        let gasUsedAll = await happyFlow.join(instance, accounts, 
            complaintData.dkgData.encPks, complaintData.dkgData.merkleCommit);
    }
    
    async function postJoin() {
        let instance = await dkg.deployed();
        let gasUsed = await happyFlow.postEnrollment(instance);
    }


contract('Interactive public-private commitment complaint - justified', async (accounts) => {
    // accounts.shift(); // the first account will only deploy the contract

    let challengerIndex = complaintData.complaint.challenger;
    let accusedIndex = complaintData.complaint.accused;

    it("Post-Deploy check", postDeploy);
    
    it("Join", join.bind(this, accounts));

    it("Post join - until all data received", postJoin);

});