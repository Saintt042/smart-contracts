var SPRINGToken = artifacts.require("./SPRINGToken.sol");
var AirDrop = artifacts.require("./AirDrop.sol");

contract('Airdrop', function(accounts) {

    var airdropInstance;
    var tokenInstance;
    var eth_contract_balance = 5*(10**18);
    // random address as need 0 eth balance account to test
    var zero_balance = '0xf59b7E0F657B0DCBaD411465F5A534121fF42B58';
    var zero_balance2 = '0xf59b7E0F657B0DCBaD411465F5A534121fF42B57';

    before(function () {
        return AirDrop.deployed().then(function(instance) {
            airdropInstance = instance;
            return SPRINGToken.deployed();
        }).then(function(token) {
            tokenInstance = token;
            airdropInstance.send(eth_contract_balance,{from:accounts[0]});
        });
    });

    it("should have token defined", function() {
        return airdropInstance.tokenInstance.call().then(function(instance){
            assert.isDefined(instance, "Token address should be defined");
            assert.equal(instance,tokenInstance.address ,"Token address should be same as SRPMT");
        });
    });

    it("should have balance 5 eth", function() {
        assert.equal(eth_contract_balance,web3.eth.getBalance(airdropInstance.address).toNumber() ,"should have balance 5 eth");
    });

    it("airdrop should fail as no balance is assigned", function() {
        var address = [accounts[1],accounts[2]];
        return airdropInstance.doAirDrop(address,1).then(function(instance){
            assert.isFalse(instance, "transaction should have thrown error");
        }).catch(function(err) {
            assert.isDefined(err, "transaction should have thrown error");
        });
    });

    it("do 1 token airdrop to 2 different address", function() {
        var amount = 1;
        var eth_amount = 100;

        // Get initial balances of first and second account.
        var account_one = accounts[1];
        var account_two = zero_balance;
        var account_three = zero_balance2;

        var account_one_starting_balance;
        var account_two_starting_balance;
        var account_three_starting_balance;

        var account_one_ending_balance;
        var account_two_ending_balance;
        var account_three_ending_balance;

        var account_one_eth_starting_balance = web3.eth.getBalance(account_one).toNumber();
        var account_two_eth_starting_balance = web3.eth.getBalance(account_two).toNumber();
        var account_three_eth_starting_balance = web3.eth.getBalance(account_two).toNumber();

        var account_one_eth_ending_balance;
        var account_two_eth_ending_balance;
        var account_three_eth_ending_balance;

        var address = [account_one,account_two];

        var address_batch_2 = [account_three];

        return tokenInstance.mint(10000)
        .then(function(instance){
            // transfer token to airdrop
            return tokenInstance.transfer(airdropInstance.address, 100);
        }).then(function(instance){
            // check balance for account 1
            return tokenInstance.balanceOf.call(account_one);
        }).then(function(balance){
            account_one_starting_balance = balance.toNumber();
            // check balance for account 2
            return tokenInstance.balanceOf.call(account_two);
        }).then(function(balance){
            account_two_starting_balance = balance.toNumber();
            // check balance for account 2
            return tokenInstance.balanceOf.call(account_three);
        }).then(function(balance){
            account_three_starting_balance = balance.toNumber();
            // do airdrop
            return airdropInstance.doAirDrop(address,amount,eth_amount);
        }).then(function(){
            // do airdrop batch 2 with high eth amount
            return airdropInstance.doAirDrop(address_batch_2,amount,eth_contract_balance);
        }).then(function(){
            // check balance for account 1
            return tokenInstance.balanceOf.call(account_one);
        }).then(function(balance){
          account_one_ending_balance = balance.toNumber();
            // check balance for account 2
            return tokenInstance.balanceOf.call(account_two);
        }).then(function(balance){
          account_two_ending_balance = balance.toNumber();
            // check balance for account 3
            return tokenInstance.balanceOf.call(account_three);
        }).then(function(balance){
            account_three_ending_balance = balance.toNumber();
            // check if balance has updated or not
            assert.equal(account_one_ending_balance, account_one_starting_balance + amount, "Amount wasn't sent to the receiver one");
            assert.equal(account_two_ending_balance, account_two_starting_balance + amount, "Amount wasn't correctly sent to the receiver two");
            assert.equal(account_three_ending_balance, account_three_starting_balance + amount, "Amount wasn't correctly sent to the receiver three");
            // fetch final eth balance
            account_one_eth_ending_balance = web3.eth.getBalance(account_one).toNumber();
            account_two_eth_ending_balance = web3.eth.getBalance(account_two).toNumber();
            account_three_eth_ending_balance = web3.eth.getBalance(account_three).toNumber();

            // check if eth is updated for 2nd and remains the same for first
            assert.equal(account_one_eth_ending_balance, account_one_eth_starting_balance, "Eth balance is not the same");
            assert.equal(account_two_eth_ending_balance, account_two_eth_starting_balance + eth_amount, "Eth balance was not update correctly");
            assert.equal(account_three_eth_ending_balance, account_three_eth_starting_balance, "Eth balance is not the same when eth amount passed was more then balance");
        });
    });
});
