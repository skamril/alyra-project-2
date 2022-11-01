const { BN, expectRevert, expectEvent } = require("@openzeppelin/test-helpers");
const { expect } = require("chai");
const constants = require("@openzeppelin/test-helpers/src/constants");

const Voting = artifacts.require("Voting");

contract("Voting", (accounts) => {
  const owner = accounts[0];
  const voter1 = accounts[1];
  const voter2 = accounts[2];
  const availableAccounts = accounts.slice(3);
  const firstProposalId = new BN(1);
  const onlyOwnerErr = "Ownable: caller is not the owner";
  const onlyVotersErr = "You're not a voter";
  let votingInstance;

  // Utils

  const addVoter = (voter = voter1, from = owner) =>
    votingInstance.addVoter(voter, { from });
  const addProposal = (description, from = voter1) =>
    votingInstance.addProposal(description, { from });
  const setVote = (id = firstProposalId, from = voter1) =>
    votingInstance.setVote(id, { from });

  // Tests

  describe("Registration", () => {
    it("add voters", async () => {
      votingInstance = await Voting.deployed();
      expectEvent(await addVoter(), "VoterRegistered", {
        voterAddress: voter1,
      });
      expectEvent(await addVoter(voter2, owner), "VoterRegistered", {
        voterAddress: voter2,
      });
    });

    it("add a voter from non owner", async () => {
      const newVoter = availableAccounts.pop();
      await expectRevert(addVoter(newVoter, voter1), onlyOwnerErr);
    });

    it("add a voter already registered", async () => {
      await expectRevert(addVoter(), "Already registered");
    });

    it("add a voter on a wrong workflow status", async () => {
      await votingInstance.startProposalsRegistering();
      await expectRevert(addVoter(), "Voters registration is not open yet");
    });
  });

  describe("Proposal", () => {
    it("add proposals", async () => {
      expectEvent(await addProposal("foo"), "ProposalRegistered", {
        proposalId: firstProposalId,
      });
      expectEvent(await addProposal("bar"), "ProposalRegistered", {
        proposalId: firstProposalId.add(new BN(1)),
      });
    });

    it("add proposal from non voter", async () => {
      await expectRevert(addProposal("baz", owner), onlyVotersErr);
    });

    it("add empty proposal", async () => {
      await expectRevert(
        addProposal(""),
        "Vous ne pouvez pas ne rien proposer"
      );
    });

    it("add proposal on a wrong workflow status", async () => {
      await votingInstance.endProposalsRegistering();
      await expectRevert(addProposal("test"), "Proposals are not allowed yet");
    });
  });

  describe("Vote", () => {
    it("set vote", async () => {
      await votingInstance.startVotingSession();
      expectEvent(await setVote(), "Voted", {
        voter: voter1,
        proposalId: firstProposalId,
      });
    });

    it("set vote from non voter", async () => {
      await expectRevert(
        votingInstance.setVote(firstProposalId, { from: owner }),
        onlyVotersErr
      );
    });

    it("set vote twice", async () => {
      await expectRevert(setVote(), "You have already voted");
    });

    it("set vote with wrong id", async () => {
      await expectRevert(setVote(new BN(10), voter2), "Proposal not found");
    });

    it("set vote on a wrong workflow status", async () => {
      await votingInstance.endVotingSession();
      await expectRevert(
        setVote(firstProposalId, voter2),
        "Voting session havent started yet"
      );
    });
  });

  describe("Result", () => {
    it("check winner", async () => {
      await votingInstance.tallyVotes();
      const winningProposalID = await votingInstance.winningProposalID.call();
      expect(winningProposalID).to.be.bignumber.equal(firstProposalId);
    });
  });
});
