pragma solidity ^0.5.0;
    
library ecOps {
    ////////////////////////////////////////////////////////
    // EC operations - precompiled contracts for bn256 only!
    ////////////////////////////////////////////////////////

    // The curve y^2 = x^3 + a*x + b (x,y in modulo n field)
    uint256 public constant b = 3;
    uint256 public constant p = 0x30644E72E131A029B85045B68181585D97816A916871CA8D3C208C16D87CFD47;
    uint256 public constant q = 0x30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f0000001;

    

    function ecmul(uint256[2] memory p0, uint256 scalar) public
        returns(uint256[2] memory p1) 
    {
        uint256[3] memory input;
        input[0] = p0[0];
        input[1] = p0[1];
        input[2] = scalar;

        assembly{
            // call ecmul precompile
            if iszero(call(not(0), 0x07, 0, input, 0x60, p1, 0x40)) {
                revert(0, 0)
            }
        }
    }


    function ecadd(uint256[2] memory p0, uint256[2] memory p1) public
        returns(uint256[2] memory p2) 
    {
        uint256[4] memory input;
        input[0] = p0[0];
        input[1] = p0[1];
        input[2] = p1[0];
        input[3] = p1[1];

        assembly{
            // call ecadd precompile
            if iszero(call(not(0), 0x06, 0, input, 0x80, p2, 0x40)) {
                revert(0, 0)
            }
        }
    }


    function pairingCheck(uint256[2] memory x, uint256[4] memory w, uint256[2] memory y, uint256[4] memory z) 
        internal 
        returns (bool) 
    {
        //returns e(a,x) == e(b,y)
        uint256[12] memory input = [
            x[0], x[1], w[0], w[1], w[2], w[3], 
            y[0], p - y[1], z[0], z[1], z[2], z[3]
        ];
        uint[1] memory result;

        assembly {
            if iszero(call(not(0), 0x08, 0, input, 0x180, result, 0x20)) {
                revert(0, 0)
            }
        }
        return result[0]==1;
    }


    // Return true iff p1 equals to p2 (points on the elliptic curve)
    function isEqualPoints(uint256[2] memory p1, uint256[2] memory p2) public pure
        returns(bool isEqual)
    {
        return (p1[0] == p2[0] && p1[1] == p2[1]);
    }


    // Returns true iff p1 is in G1 group
    function isInG1(uint256[2] memory p1) public pure
        returns(bool)
    {
        if (p1[0] == 0 && p1[1] == 0) {
            return true;
        }

        uint256 x3 = mulmod(p1[0], p1[0], p);
        x3 = mulmod(x3, p1[0], p);
        x3 = addmod(x3, b, p);
        uint256 y2 = mulmod(p1[1], p1[1], p);

        return x3 == y2;
    }


    // TODO: make it more gas efficient by implementing the check by yourself
    // Returns true iff p1 is in G2.
    function isInG2(uint256[4] memory p1) public
        returns(bool)
    {
        uint256[12] memory input = [
            1, 2, p1[0], p1[1], p1[2], p1[3], 
            1, p - 2, p1[0], p1[1], p1[2], p1[3]
        ];
        uint[1] memory result;
        bool isIn = true;

        assembly {
            if iszero(call(not(0), 0x08, 0, input, 0x180, result, 0x20)) {
                isIn := 0
            }
        }
        return isIn;
    }
}