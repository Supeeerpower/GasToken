const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("Fuse Token", function () {
  let Fuse;
  let fuse;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    Fuse = await ethers.getContractFactory("Fuse");
    fuse = await upgrades.deployProxy(Fuse, [], {
      initializer: "initialize",
    });
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await fuse.owner()).to.equal(owner.address);
    });

    it("Should assign the total supply of tokens to the owner", async function () {
      const ownerBalance = await fuse.balanceOf(owner.address);
      expect(await fuse.totalSupply()).to.equal(ownerBalance);
    });

    it("Should have correct initial supply", async function () {
      const expectedSupply = ethers.parseUnits("1000000", 18); // 1 million tokens
      expect(await fuse.totalSupply()).to.equal(expectedSupply);
    });
  });

  describe("Transactions", function () {
    it("Should transfer tokens between accounts", async function () {
      const amount = ethers.parseUnits("100", 18);
      await fuse.transfer(addr1.address, amount);
      expect(await fuse.balanceOf(addr1.address)).to.equal(amount);

      await fuse.connect(addr1).transfer(addr2.address, amount);
      expect(await fuse.balanceOf(addr2.address)).to.equal(amount);
    });

    it("Should fail if sender doesn't have enough tokens", async function () {
      const initialOwnerBalance = await fuse.balanceOf(owner.address);
      await expect(
        fuse.connect(addr1).transfer(owner.address, 1)
      ).to.be.revertedWithCustomError(fuse, "ERC20InsufficientBalance");
    });
  });

  describe("Minting", function () {
    it("Should allow owner to mint tokens", async function () {
      const amount = ethers.parseUnits("100", 18);
      await fuse.mint(addr1.address, amount);
      expect(await fuse.balanceOf(addr1.address)).to.equal(amount);
    });

    it("Should not allow non-owner to mint tokens", async function () {
      const amount = ethers.parseUnits("100", 18);
      await expect(
        fuse.connect(addr1).mint(addr1.address, amount)
      ).to.be.revertedWithCustomError(fuse, "OwnableUnauthorizedAccount");
    });
  });

  describe("Pausable", function () {
    it("Should allow owner to pause and unpause", async function () {
      const amount = ethers.parseUnits("100", 18);
      await fuse.pause();
      await expect(
        fuse.transfer(addr1.address, amount)
      ).to.be.revertedWithCustomError(fuse, "EnforcedPause");

      await fuse.unpause();
      await fuse.transfer(addr1.address, amount);
      expect(await fuse.balanceOf(addr1.address)).to.equal(amount);
    });

    it("Should not allow non-owner to pause", async function () {
      await expect(fuse.connect(addr1).pause()).to.be.revertedWithCustomError(
        fuse,
        "OwnableUnauthorizedAccount"
      );
    });
  });
});
