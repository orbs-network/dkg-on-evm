const constants = require('../testsData/constants.js');
const general = require('./general.js');


async function complain(instance, accounts, challengerIndex, accusedIndex) {
    await general.verifyPhase(constants.phase.postEnrollment, instance);

    let res = await instance.complainDataMissing(
        challengerIndex, 
        accusedIndex, 
        {from: accounts[challengerIndex-1]}
      );
    
    await general.verifyPhase(constants.phase.complaint, instance);

    return res.receipt.gasUsed;

}


async function postMissingData(instance, accounts, accusedIndex, 
    pubCommitG1Data, pubCommitG2Data, prvCommitEncData) {


    // delete empty strings
    prvCommitEncData = prvCommitEncData.filter(function (el) {
        return el;
    });

    let hashesG1 = pubCommitG1Data.map((point) => {
        return web3.utils.soliditySha3.apply(this, point);
    });

    let vG1 = [], rG1 = [], sG1 =[];

    for (var i = 0; i < hashesG1.length; ++i) {
        let sig = await general.signWithHash(instance, hashesG1[i], accounts[accusedIndex-1]);
        vG1.push(sig.v);
        rG1.push(sig.r);
        sG1.push(sig.s);
    }

    pubCommitG1Data = _.flatMap(pubCommitG1Data);

    let hashesG2 = pubCommitG2Data.map((point) => {
        return web3.utils.soliditySha3.apply(this, point);
    });

    let vG2 = [], rG2 = [], sG2 =[];
    for (var i = 0; i < hashesG2.length; ++i) {
        let sig = await general.signWithHash(instance, hashesG2[i], accounts[accusedIndex-1]);
        vG2.push(sig.v);
        rG2.push(sig.r);
        sG2.push(sig.s);
    }

    pubCommitG2Data = _.flatMap(pubCommitG2Data);

    let vPr = [], rPr = [], sPr =[];
    for (var i = 0; i < prvCommitEncData.length; ++i) {
        let sig = await general.sign(instance, prvCommitEncData[i], accounts[accusedIndex-1]);        
        vPr.push(sig.v);
        rPr.push(sig.r);
        sPr.push(sig.s);
    }
      
    
    let args = [
        pubCommitG1Data, pubCommitG2Data, prvCommitEncData, 
        vG1, rG1, sG1, 
        vG2, rG2, sG2,
        vPr, rPr, sPr,
        {from: accounts[accusedIndex-1]}];
    // console.log(args);
    
    let res = await instance.postMissingData.apply(this, args);

    return res.receipt.gasUsed;

}



module.exports = {
    complain,
    postMissingData,
};