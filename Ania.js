const Ania = artifacts.require('ArkaniaProtocol');

// Start a test series named AniaToken, it will use 10 test accounts
contract('AniaToken', async accounts => {
    let aniaToken;

    before(async () => {
        //Load contracts
        aniaToken = await Ania.new();
    });

    // each it is a new test, and we name our first test initial supply
    it('initial supply', async() => {
        // call our totalSUpply function
        const supply = await aniaToken.totalSupply();

        // Assert that the supply matches what we set in migration
        assert.equal(supply.toString(), '100000000000000000000000000', 'Initial supply was not the same as in migration');
    });

    it('transfering tokens', async() => {
        // Grab initial balance
        const initial_balance = await aniaToken.balanceOf(accounts[1]);

        // transfer tokens from account 0 to 1
        await aniaToken.transfer(accounts[1], 100);

        const after_balance = await aniaToken.balanceOf(accounts[1]);

        assert.equal(after_balance.toNumber(), initial_balance.toNumber() + 100, 'Balance should have increased on reciever');

        // We can change the msg.sender using the FROM value in function calls.
        const account2_initial_balance = await aniaToken.balanceOf(accounts[2]);

        await aniaToken.transfer(accounts[2], 20, { from: accounts[1] });
        // Make sure balances are switched on both accounts
        const account2_after_balance = await aniaToken.balanceOf(accounts[2]);
        const account1_after_balance = await aniaToken.balanceOf(accounts[1]);

        assert.equal(account1_after_balance.toNumber(), after_balance.toNumber() - 20, 'Should have reduced account 1 balance by 20');
        assert.equal(account2_after_balance.toNumber(), account2_initial_balance.toNumber() + 20, 'Should have givne accounts 2 20 tokens');

        // Try transfering too much
        try {
          await aniaToken.transfer(accounts[2], 100, { from: accounts[1] });
        } catch (error){
          assert.equal(error.reason, 'ERC20: transfer amount exceeds balance');
        }
    });

    it('allow account some allowance', async() => {
        try {
          // Give account(0) access too 100 tokens on creator
          await aniaToken.approve('0x0000000000000000000000000000000000000000', 100);
        } catch (error){
          assert.equal(error.reason, 'ERC20: approve to the zero address', 'Should be able to approve zero address');
        }

        try {
          // Give account 1 access too 100 tokens on zero account
          await aniaToken.approve(accounts[1], 100);
        } catch (error){
          assert.fail(error); // shold not fail
        }

        // Verify by checking allowance
        const allowance = await aniaToken.allowance(accounts[0], accounts[1]);

        assert.equal(allowance.toNumber(), 100, 'Allowance was not correctly inserted');
    });

    it('transfering with allowance', async() => {
        try {
          // Account 1 should have 100 tokens by now to use on account 0
          // lets try using more
          await aniaToken.transferFrom(accounts[0], accounts[2], 200, { from: accounts[1] });
        } catch (error){
          assert.equal(error.reason, 'ERC20: transfer amount exceeds allowance', 'Failed to detect overspending');
        }
        const init_allowance = await aniaToken.allowance(accounts[0], accounts[1]);
        try {
          // Account 1 should have 100 tokens by now to use on account 0
          // lets try using more
          const worked = await aniaToken.transferFrom(accounts[0], accounts[2], 50, { from: accounts[1] });
        } catch (error){
          assert.fail(error);
        }

        // Make sure allowance was changed
        const allowance = await aniaToken.allowance(accounts[0], accounts[1]);
        assert.equal(allowance.toNumber(), 50, 'The allowance should have been decreased by 50');
    });
});
