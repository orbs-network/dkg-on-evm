# DKG on EVM
Distributed key generation on Ethereum virtual machine for BLS threshold signature using the elliptic curve BN256.

Compatible with [BGLS](https://github.com/orbs-network/bgls) library.

## Building from source

### Prerequisites
* Node.js (tested on v10.6.0)
* [Truffle](https://truffleframework.com/)
    > install: `npm install -g truffle`
* [Ganache](https://truffleframework.com/ganache)
    * make sure at least 3 accounts are created.

### Installation
```
git clone https://github.com/orbs-network/dkg-on-evm.git
cd dkg-on-evm
npm install
```

## Tests

### Run tests
* Full test run:
    > `truffle test`
* Specific test run:
    > `truffle test ./test/<name_of_test>.js` 

### Test files
* testHappyFlow.js - tests a successful flow.
* testComplaints.js - tests justified/unjustified complaints.
* testTimeouts.js - tests timeouts occurnce in enrollment and commitment phases.

### Test issues
* The tests may take rather long time. Right now there are two options to make the test go faster without damaging the quality of the tests. First, make sure the timeouts, that are defined inside the DKG contract, are small. Second, make sure that the not too many account are created in the Ganache client (the minimum number of accounts for the tests to work properly is 3 accounts).

## Simulation
In [simulation](https://github.com/orbs-network/dkg-on-evm/tree/master/simulation) directory.

## License
MIT