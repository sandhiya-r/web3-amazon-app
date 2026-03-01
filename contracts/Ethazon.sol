// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// owner of the store receives the funds of the purchases 
contract Ethazon {
    address public owner;
    mapping(uint256 => Product) public products;
    mapping(address => uint256) public orderCount; // maps buyer address to amount of orders
    mapping(address => mapping(uint256=>Order)) public orders; // maps buyer address to map of orders

    constructor() {
        owner = msg.sender;
    }

    // model of product
    struct Product{
        uint256 id;
        string name;
        string category;
        string image;
        uint256 rating;
        uint256 cost;
        uint256 stock;
    }

    // model of an order
    struct Order{
        uint256 timeOfOrder;
        Product product;
    }

    event List(string name, uint256 cost, uint256 quantity);
    event Buy(address buyer, uint256 orderId, uint256 itemId);

    // List products
    function list(
        uint256 _id,
        string memory _name,
        string memory _category,
        string memory _image,
        uint256 _rating,
        uint256 _cost,
        uint256 _stock
    ) public onlyOwner{
        Product memory newProduct = Product(_id, _name, _category, _image, _rating, _cost, _stock);
        products[_id] = newProduct; // add product to mapping

        // emit the event - allows anyone to subscribe and get alerts, can fetch event stream to see history of all function calls
        emit List(_name, _cost, _stock);
    }

    // Buy products
    function buy(uint256 _id) public payable{
        require(msg.value >= products[_id].cost);
        require(products[_id].stock > 0);
        // create an order
        Order memory order = Order(block.timestamp, products[_id]);
        // save order to chain
        orderCount[msg.sender]++; // order count serves as the order ID
        orders[msg.sender][orderCount[msg.sender]] = order;
        // subtract stock
        products[_id].stock--; 
        // emit buy event
        emit Buy(msg.sender, orderCount[msg.sender], _id);
    }

    // Withdraw funds (only owner should be able to do this)
    function withdraw() public onlyOwner{
        (bool success,) = owner.call{value: address(this).balance}(""); // this refers to address of smart contract we are calling inside of
        require(success);
    }

    // Modifiers
    modifier onlyOwner(){
        require(msg.sender == owner);
        _;
    }
}
