pragma solidity ^0.4.0;

library g2Ops {

    uint256 public constant p = 0x30644E72E131A029B85045B68181585D97816A916871CA8D3C208C16D87CFD47;



    // Return true iff p1 equals to p2 (points on the elliptic curve)
    function isEqualPoints(uint256[2] p1, uint256[2] p2) public pure
        returns(bool isEqual)
    {
        return (p1[0] == p2[0] && p1[1] == p2[1]);
    }


    function addGfp2(uint256[2] f1, uint256[2] f2) public pure
        returns(uint256[2] f)
    {
        f[0] = addmod(f1[0], f2[0], p);
        f[1] = addmod(f1[1], f2[1], p);
    }


    function mulGfp2(uint256[2] f1, uint256[2] f2) public pure
        returns(uint256[2] f)
    {
        uint256 t_x = mulmod(f1[0], f2[1], p);
        uint256 t = mulmod(f2[1], f1[0], p);
        f[0] = addmod(t_x, t, p);

        uint256 t_y = mulmod(f1[1], f2[1], p);
        t = mulmod(f1[0], f2[0], p);
        f[1] = addmod(t_y, p-t, p);
    }


    function squareGfp2(uint256[2] f1) public pure
        returns(uint256[2] f)
    {
        uint256 t_x = addmod(f1[1], p-f1[0], p);
        uint256 t_y = addmod(f1[0], f1[1], p);
        f[1] = mulmod(t_x, t_y, p);
        t_x = mulmod(f1[0], f1[1], p);
        f[1] = addmod(t_x, t_x, p);
    }


    function isOnC2Curve(uint256[4] p1) public pure
        returns(bool)
    {
        // if (p1[0] == 0 && p1[1] == 0 && p1[2] == 0 && p1[3] == 0) {
        //     return true;
        // }
        uint256[2] memory twistB = [
            0x38e7ecccd1dcff6765f0b37d93ce0d3ed749d0dd22ac00aa0141b9ce4a688d4d,
            0x3bf938e377b802a8020b1b273633535d26b7edf0497552602514c6324384a86d
        ];

        uint256[2] memory px = [p1[0], p1[1]];
        uint256[2] memory py = [p1[2], p1[3]];
        uint256[2] memory y2 = squareGfp2(py);
        uint256[2] memory x3 = addGfp2(mulGfp2(px, squareGfp2(px)), twistB);
        
        return isEqualPoints(x3, y2);
    }
}