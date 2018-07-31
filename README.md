# DKG on EVM
Distributed key generation on Ethereum virtual machine for BLS threshold signature using the elliptic curve BN256.

Compatible with [BGLS](https://github.com/orbs-network/bgls) library.

## Building from source

### Prerequisites
* Node.js (tested on v10.6.0)
* [Truffle](https://truffleframework.com/)
    > install: `npm install -g truffle`
* [Ganache](https://truffleframework.com/ganache)

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

## Simulation
To be added

## License
MIT