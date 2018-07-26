# bls-bn-curve

Demo client of [BGLS package](https://github.com/orbs-network/bgls). It demonstrates 2 flows:
* Happy flow - in which clients enroll with the DKG contract and then commit, and no client is trying to deceive any other client.
* Complaint flow - in which a client (malicious) intentionally sends incorrect commitments to another client (complainer).
The complainer then sends a `complaint()` transaction against a specific client (accused).
The malicious and accused clients need not be the same client. In case the complaint is justified, the accused/malicious client gas its deposit slashed and distributed among the other clients.
In case the complaint is unjustified, the complainer's deposit is slashed and distributed among the other clients.

As this is a demo, some code parts are very rudimentary. There is nearly no error checking, and in cases where the app cannot continue, the Go code just throws a panic().

## Installation

* Go to the directory under which you want to clone this repo
* `git clone git@github.com:orbs-network/bls-bn-curve.git`
* `cd bls-bn-curve`
* `yarn install`

## Prerequisites
* node
* truffle/ganache suite

## Running examples

There are 2 examples. To run them, first `cd src`, then:
* To run the BLS example, run: `node bls-example.js`
* To run the DKG example, run: `node dkg-example.js`

## Docs

The demo code is written in JavaScript and Go.
The JavaScript part contains the web3 interface with the smart contract:
 * Compilation
 * Deployment
 * Sending transactions
 * Calling methods
 * Registering/unregistering/listening to events
 * Collecting info about gas used
 *

The Go part interfaces with the [BGLS package](https://github.com/orbs-network/bgls)
 * Calls BGLS methods
 * Demonstrates technical aspects of Go: JSON serialization (including custom structs), using of Big Integers - serialization, conversions to/from strings, with decimal/hex notations

Both JS and Go code show how parts of the code can be made interactive (just as waiting for user to press Space, enter input) in case you want to use this in a live demo, as we have done internally.

The JS code is the main part of the app, and it invokes the Go executable's various functions. Data passes between JS and Go either by command line arguments, having JS collect Go's stdout output, or writing data to a disk file.
No single method was suitable for all use cases and having several methods in place also serve as a technical demo of how this can be accomplished.

While it is possible to run Ganache internally by the demo app (it can start Ganache, do its work, and then stop Ganache), it is far more informative to manually load
a Ganache instance with its UI, and observe the progress of transactions and the accounts' balance - especially in complaint flows where one account has its deposit slashed (forfeited) and the other accounts split it between them.

## Files
* bglsmain.go - The Go code - it is compiled to an independent executable
* src/app.js - entrypoint of the demo app, including the flow logic
* src/bglswrapper.js - helper functions including the calls to the Go process
* contracts/dkgEnc.sol - The DKG contract we use




