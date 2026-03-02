// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/ReputationManager.sol";

contract ReputationManagerTest is Test {
    ReputationManager public reputation;
    address public owner = address(this);
    address public recorder = makeAddr("recorder");
    address public user = makeAddr("user");

    function setUp() public {
        reputation = new ReputationManager();
        reputation.setRecorder(recorder, true);
    }

    function testSetRecorder() public {
        assertTrue(reputation.authorizedRecorders(recorder));

        reputation.setRecorder(recorder, false);
        assertFalse(reputation.authorizedRecorders(recorder));
    }

    function testSetRecorderOnlyOwner() public {
        vm.prank(user);
        vm.expectRevert();
        reputation.setRecorder(user, true);
    }

    function testRecordTransaction() public {
        vm.prank(recorder);
        reputation.recordTransaction(0, user, true, 450);

        (uint256 totalTxns, uint256 successRate, uint256 avgRating, uint256 compositeScore) =
            reputation.getReputation(0);

        assertEq(totalTxns, 1);
        assertEq(successRate, 10000); // 100%
        assertEq(avgRating, 450);
        assertGt(compositeScore, 0);
    }

    function testRecordTransactionUnauthorized() public {
        vm.prank(user);
        vm.expectRevert("Not authorized recorder");
        reputation.recordTransaction(0, user, true, 300);
    }

    function testRatingBounds() public {
        vm.startPrank(recorder);

        vm.expectRevert("Rating must be 100-500");
        reputation.recordTransaction(0, user, true, 99);

        vm.expectRevert("Rating must be 100-500");
        reputation.recordTransaction(0, user, true, 501);

        // These should work
        reputation.recordTransaction(0, user, true, 100);
        reputation.recordTransaction(0, user, true, 500);

        vm.stopPrank();
    }

    function testMultipleTransactions() public {
        vm.startPrank(recorder);
        reputation.recordTransaction(0, user, true, 400);
        reputation.recordTransaction(0, user, true, 500);
        reputation.recordTransaction(0, user, false, 200);
        vm.stopPrank();

        (uint256 totalTxns, uint256 successRate, uint256 avgRating, ) =
            reputation.getReputation(0);

        assertEq(totalTxns, 3);
        assertEq(successRate, 6666); // 2/3 ≈ 66.66%
        assertEq(avgRating, 366); // (400+500+200)/3 = 366
    }

    function testZeroTransactionsReputation() public view {
        (uint256 totalTxns, uint256 successRate, uint256 avgRating, uint256 compositeScore) =
            reputation.getReputation(99);

        assertEq(totalTxns, 0);
        assertEq(successRate, 0);
        assertEq(avgRating, 0);
        assertEq(compositeScore, 0);
    }

    function testCompositeScore() public {
        vm.startPrank(recorder);
        // Perfect: 100% success, 500 rating
        reputation.recordTransaction(0, user, true, 500);
        vm.stopPrank();

        (, uint256 successRate, uint256 avgRating, uint256 compositeScore) =
            reputation.getReputation(0);

        assertEq(successRate, 10000);
        assertEq(avgRating, 500);
        // 60% of 10000 scaled to 600 = 600, 40% of (500-100)*400/400 = 400
        assertEq(compositeScore, 1000);
    }
}
