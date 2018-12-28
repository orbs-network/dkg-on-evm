const async = require("async");



/**
 * Returns true iff the elements of 2 arrays are equal.
 * @param {object[]} p1 
 * @param {object[]} p2 
 */
function isEqualPoints(p1, p2) {
    if (p1.length == p2.length)
    {
      for(var i = 0; i < p1.length; i++) {
        if(p1[i] != p2[i]) {
          return false;
        }
      }
      return true;
    }
    return false;
} 

/**
 * Mines numOfBlockToMine at once.
 * @param {number} numOfBlockToMine 
 */
function forceMineBlocks(numOfBlockToMine) {
    var mineArr = [];
    for (var i = 0; i < numOfBlockToMine; i++) {  
      // web3.providers.HttpProvider.prototype.sendAsync = web3.providers.HttpProvider.prototype.send;  
      // console.log(web3.currentProvider.sendAsync);
        
      mineArr.push(async.apply(web3.currentProvider.send, {
        jsonrpc: "2.0",
        method: "evm_mine",
        id: 12345
      }));
    }
    return new Promise( (resolve, reject) => {
      async.parallel(mineArr, (err) => { resolve() });
    });
}



module.exports = {
    isEqualPoints,
    forceMineBlocks
}