const { expect } = require("chai");
const { ethers } = require("hardhat");

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

describe("Ethazon", () => {
  let ethazon;
  let deployer, buyer;
  const ID = 1;
        const NAME = "Pants";
        const CATEGORY = "Clothing";
        const IMAGE = "IMAGE";
        const COST = tokens(1);
        const RATING = 4;
        const STOCK = 10;

  beforeEach(async () => {
    // setup accounts
    [deployer, buyer] = await ethers.getSigners(); // returns array of ethereum accounts connected with the network
    console.log(deployer,buyer)

    //Deploy contract
      const Ethazon = await ethers.getContractFactory("Ethazon");
      ethazon = await Ethazon.deploy(); // deploys to test blockchain
  })

  describe("Deployment", () => {
       it("sets an owner", async () => {
           expect(await ethazon.owner()).to.equal(deployer.address);
       })
  })

  describe("Listing", () => {
        let transaction;

        beforeEach(async () => {
           transaction = await ethazon.connect(deployer).list(
            ID, NAME, CATEGORY, IMAGE, RATING, COST, STOCK
           );

           await transaction.wait(); // waiting for transaction to finish
       })

       it("Returns item attributes", async () => {
           const itemId = await ethazon.products(1);
           expect(itemId.id).to.equal(ID);
           expect(itemId.name).to.equal(NAME);
           expect(itemId.category).to.equal(CATEGORY);
           expect(itemId.rating).to.equal(RATING);
           expect(itemId.image).to.equal(IMAGE);
           expect(itemId.cost).to.equal(COST);
           expect(itemId.stock).to.equal(STOCK);

       })

        it("Emits list event", async () => {
           expect(transaction).to.emit(ethazon, "List");

       })

       it("Cannot list if not owner", async () => {
          const transaction2 = ethazon.connect(buyer).list(
            ID, NAME, CATEGORY, IMAGE, RATING, COST, STOCK
           );
           await expect(transaction2).to.be.reverted;

       })
  })

  describe("Buying", () => {
        let transaction;
        

        beforeEach(async () => {
           transaction = await ethazon.connect(deployer).list(
            ID, NAME, CATEGORY, IMAGE, RATING, COST, STOCK
           );

           await transaction.wait(); // waiting for transaction to finish

           // buy item
           transaction = await ethazon.connect(buyer).buy(ID, {value: COST});

       })

       it("Updates the contract balance", async () => {
          const result = await ethers.provider.getBalance(ethazon.address);
          expect(result).to.equal(COST);
       })

        it("Updates the order count", async () => {
          const result = await ethazon.orderCount(buyer.address);
          expect(result).to.equal(1);
       })

       it("Adds the order", async () => {
          const result = await ethazon.orders(buyer.address, 1);
          expect(result.timeOfOrder).to.be.greaterThan(0); // can't get exact time unless you freeze blockchain
          expect(result.product.name).to.equal(NAME);
       })

  })

  describe("Withdrawing", () => {
        let transaction;
        let balanceBefore;

        beforeEach(async () => {
           transaction = await ethazon.connect(deployer).list(
            ID, NAME, CATEGORY, IMAGE, RATING, COST, STOCK
           );

           await transaction.wait(); // waiting for transaction to finish

           transaction = await ethazon.connect(buyer).buy(ID, {value: COST});
           await transaction.wait();
           balanceBefore = await ethers.provider.getBalance(deployer.address);

          
           transaction = await ethazon.connect(deployer).withdraw();
           await transaction.wait();

       })

       it("Updates the owner balance", async ()=>{
          const balanceAfter = await ethers.provider.getBalance(deployer.address);
          expect(balanceAfter).to.be.greaterThan(balanceBefore);
       })
    
  })
 
})
