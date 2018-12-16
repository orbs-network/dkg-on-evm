const constants = require('../testsData/constants.js');
const general = require('./general.js');





async function complain(instance, accounts, challengerIndex, accusedIndex) {
    await general.verifyPhase(constants.phase.allDataReceived, instance);

    let res = await instance.complainPubPrivData(
        challengerIndex, 
        accusedIndex, 
        {from: accounts[challengerIndex-1]}
      );
    
    await general.verifyPhase(constants.phase.complaint, instance);

    return res.receipt.gasUsed;
}


async function initiateInteractiveDispute(instance, accounts, challengerIndex, accusedIndex, aggPubCommitG1) {
    return await interactiveDispute(
        instance, accounts, challengerIndex, accusedIndex, aggPubCommitG1);
}


async function interactiveDispute(instance, accounts, challengerIndex, accusedIndex, aggPubCommitG1) {
    let numOfParticipants = (await instance.n.call()).toNumber();
    let t = await instance.t.call();
    let threshold = t.toNumber();
    let h = threshold+1;    
    let l = -1;
    let countChallengerTxs = 0;
    let countAccusedTxs = 0;
    let gasAll = new Array(numOfParticipants).fill(0);

    while(h-l > 1) {

        l += Math.ceil((h-l)/2);

        await general.verifyComplaintPhase(constants.complaintPhase.accusedTurn, instance);

        let argsAccused = [
            aggPubCommitG1[l],
            {from: accounts[accusedIndex-1]}
        ];
        
        gasAll[accusedIndex-1] += (await instance.complaintAccusedTurn(
            argsAccused[0],argsAccused[1])).receipt.gasUsed;
        countAccusedTxs++;        

        let argsChallenged = [
            true,
            {from: accounts[challengerIndex-1]}
        ];
        
        await general.verifyComplaintPhase(constants.complaintPhase.challengerTurn, instance);

        gasAll[challengerIndex-1] += (await instance.complaintChallengerTurn(
            argsChallenged[0],argsChallenged[1])).receipt.gasUsed;
        countChallengerTxs++;
    }
    
    return {gasAll, countAccusedTxs, countChallengerTxs};
}


async function disputeClosure(instance, accounts, challengerIndex, accusedIndex, encPrvCommit, challengerSk){
    await general.verifyComplaintPhase(constants.complaintPhase.allAgree, instance);

    let numOfParticipants = (await instance.n.call()).toNumber();
    let gasAll = new Array(numOfParticipants).fill(0);

    let accusedAccount = accounts[accusedIndex-1];
    let signature = await general.sign(instance, encPrvCommit, accusedAccount);

    let args = [
        encPrvCommit, signature.v, signature.r, 
        signature.s, challengerSk,
        {from: accounts[challengerIndex-1]}
    ];
    
    gasAll[challengerIndex-1] = (await instance.agreeUponAll(
        args[0],args[1],args[2],args[3],args[4],args[5])).receipt.gasUsed;

    return gasAll;
}

module.exports = {
    complain,
    initiateInteractiveDispute,
    disputeClosure
};