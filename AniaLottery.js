const { assert } = require("chai");
const arkaniaProtocol = artifacts.require('ArkaniaProtocol');
const aniaStake = artifacts.require('AniaStake');
const aniaLottery = artifacts.require('AniaLottery');
const bep20Token = artifacts.require('Bep20Token');

const dateInFuture = 9123456789;
const dateInPast = 1648443245;

const firstProjectId = 5;
const firstProjectName = 'BTC';
const firstProjectRaiseGoal = 100000;
const firstProjectTokenPrice = 10;
const firstProjectTokenContractAddress = '0xde4aAF12db00fE3E437472B063494Aa591C7822F';
const firstProjectTokenBillingAddress = '0xbbe750FB8674cCE1549D5d5FD79437902D8bAfdf';
const firstProjectPercent = 10;
const secondProjectId = 8;
const secondProjectName = 'LTC';
const secondProjectRaiseGoal = 110000;
const secondProjectTokenPrice = 11;
const secondProjectTokenContractAddress = '0x534B456Fd7D207f842b532C2E39C462c962Ae705';
const secondProjectTokenBillingAddress = '0xbF033087ACE744B3A8A6B59E547b0AB138B529e3';
const secondProjectPercent = 20;
const thirdProjectId = 12;
const thirdProjectName = 'ANIA';
const thirdProjectRaiseGoal = 120000;
const thirdProjectTokenPrice = 12;
const thirdProjectTokenContractAddress = '0x804996A88a97bd8C36d03651718f79CBaE3599B7';
const thirdProjectTokenBillingAddress = '0x58EcD5721aDb8Cb55C49f078E7Ae46b870b48DC9';
const thirdProjectPercent = 25;
const fourthProjectId = 16;
const fifthProjectId = 20;
const fifthProjectName = 'TST';
const fifthProjectRaiseGoal = 1750;
const fifthProjectTokenPrice = 0.1;
const fifthProjectTokenBillingAddress = '0x091986eD164AC8f7e9c0AeAE1391e847207512Ac';
const fifthProjectPercent = 10;

require('chai')
    .use(require('chai-as-promised'))
    .should();

//helper function to convert tokens to ether
function tokenConvert(n) {
  return web3.utils.toWei(n, 'ether');
}

//helper function to convert tokens from ether
function tokenConvertBack(n) {
  return web3.utils.fromWei(n, 'ether');
}

contract('Crowdfunding', ([creator, userA, userB, userC, userD, userE, userF]) => {
    let aniaToken, tokenStaking, crowdfunding, testToken, testBusd;

    before(async () => {
        //Load contracts
        aniaToken = await arkaniaProtocol.new();
        testToken = await bep20Token.new('Test Token', 'TST', 1000000000);
        testBusd = await bep20Token.new('Test Binance Dollar', 'BUSD', 1000000000);
        tokenStaking = await aniaStake.new(aniaToken.address);
        crowdfunding = await aniaLottery.new(tokenStaking.address);

        //sending some ANIA tokens to Users
        await aniaToken.transfer(userA, tokenConvert('52000'), {
          from: creator,
        });
        await aniaToken.transfer(userB, tokenConvert('15000'), {
            from: creator,
        });
        await aniaToken.transfer(userC, tokenConvert('12500'), {
            from: creator,
        });
        await aniaToken.transfer(userD, tokenConvert('18000'), {
            from: creator,
        });
        await aniaToken.transfer(userE, tokenConvert('42000'), {
            from: creator,
        });
        await aniaToken.transfer(userF, tokenConvert('36000'), {
            from: creator,
        });

        //sending some TST tokens to Crowdfunding
        await testToken.transfer(crowdfunding.address, tokenConvert('50000000'), {
            from: creator,
        });

        //sending some test busd tokens to users
        await testBusd.transfer(userA, tokenConvert('5000'), {
            from: creator,
        });
        await testBusd.transfer(userB, tokenConvert('5000'), {
            from: creator,
        });
        await testBusd.transfer(userC, tokenConvert('5000'), {
            from: creator,
        });
        await testBusd.transfer(userD, tokenConvert('5000'), {
            from: creator,
        });
        await testBusd.transfer(userE, tokenConvert('5000'), {
            from: creator,
        });
        await testBusd.transfer(userF, tokenConvert('5000'), {
            from: creator,
        });
    });
    // Test 1
    describe('Crowdfunding values', async () => {
        it('checking default tierOne value', async () => {
            const value = await crowdfunding.tierOne();
            assert.equal(value, '50000', 'default Tier One set to 50000');
        });
        it('checking default tierOneTicketValue value', async () => {
            const value = await crowdfunding.tierOneTicketValue();
            assert.equal(value, '1000', 'default Tier One Ticket Value set to 1000');
        });
        it('checking default tierTwo value', async () => {
            const value = await crowdfunding.tierTwo();
            assert.equal(value, '20000', 'default Tier Two set to 20000');
        });
        it('checking default tierTwoTicketValue value', async () => {
            const value = await crowdfunding.tierTwoTicketValue();
            assert.equal(value, '500', 'default Tier Two Ticket Value set to 500');
        });
        it('checking default tierThree value', async () => {
            const value = await crowdfunding.tierThree();
            assert.equal(value, '10000', 'default Tier Three set to 10000');
        });
        it('checking default tierThreeTicketValue value', async () => {
            const value = await crowdfunding.tierThreeTicketValue();
            assert.equal(value, '250', 'default Tier Three Ticket Value set to 250');
        });
    });

    // Test 2
    describe('Admin function', async () => {
        let result, firstProjectUsers, secondProjectUsers, thirdProjectUsers;
        it('create first project', async () => {
            await crowdfunding.createProject(
                firstProjectId, firstProjectName, firstProjectRaiseGoal, dateInFuture, firstProjectTokenContractAddress, firstProjectTokenBillingAddress, firstProjectPercent, firstProjectTokenPrice
            );
            result = await crowdfunding.getProject(firstProjectId);
            assert.equal( result.id, firstProjectId, 'Id must be ' . firstProjectId );
            assert.equal( result.name, firstProjectName, 'Name must be ' . firstProjectName );
            assert.equal( result.raiseGoal, firstProjectRaiseGoal, 'Market Cap must be ' . firstProjectRaiseGoal );
            assert.equal( result.endDate, dateInFuture, 'End Date must be ' . dateInFuture );
            assert.equal( result.contractAddress, firstProjectTokenContractAddress, 'Contract Address must be ' . firstProjectTokenContractAddress );
            assert.equal( result.billingAddress, firstProjectTokenBillingAddress, 'Billing Address must be ' . firstProjectTokenBillingAddress );
            assert.equal( result.firstPayoutInPercent, firstProjectPercent, 'Percent must be ' . firstProjectPercent );
            assert.equal( result.tokenPrice, firstProjectTokenPrice, 'Token Price must be ' . firstProjectTokenPrice );
            assert.equal( result.draw, false, 'Drawn must be false' );
        });

        it('create second project', async () => {
            await crowdfunding.createProject(
                secondProjectId, secondProjectName, secondProjectRaiseGoal, dateInFuture, secondProjectTokenContractAddress, secondProjectTokenBillingAddress, secondProjectPercent, secondProjectTokenPrice
            );
            result = await crowdfunding.getProject(secondProjectId);
            assert.equal( result.id, secondProjectId, 'Id must be ' . secondProjectId );
            assert.equal( result.name, secondProjectName, 'Name must be ' . secondProjectName );
            assert.equal( result.raiseGoal, secondProjectRaiseGoal, 'Market Cap must be ' . secondProjectRaiseGoal );
            assert.equal( result.endDate, dateInFuture, 'End Date must be ' . dateInFuture );
            assert.equal( result.contractAddress, secondProjectTokenContractAddress, 'Contract Address must be ' . secondProjectTokenContractAddress );
            assert.equal( result.billingAddress, secondProjectTokenBillingAddress, 'Billing Address must be ' . secondProjectTokenBillingAddress );
            assert.equal( result.firstPayoutInPercent, secondProjectPercent, 'Percent must be ' . secondProjectPercent );
            assert.equal( result.tokenPrice, secondProjectTokenPrice, 'Token Price must be ' . secondProjectTokenPrice );
            assert.equal( result.draw, false, 'Drawn must be false' );
        });

        it('create third project', async () => {
            await crowdfunding.createProject(
                thirdProjectId, thirdProjectName, thirdProjectRaiseGoal, dateInFuture, thirdProjectTokenContractAddress, thirdProjectTokenBillingAddress, thirdProjectPercent,  thirdProjectTokenPrice
            );
            result = await crowdfunding.getProject(thirdProjectId);
            assert.equal( result.id, thirdProjectId, 'Id must be ' . thirdProjectId );
            assert.equal( result.name, thirdProjectName, 'Name must be ' . thirdProjectName );
            assert.equal( result.raiseGoal, thirdProjectRaiseGoal, 'Market Cap must be ' . thirdProjectRaiseGoal );
            assert.equal( result.endDate, dateInFuture, 'End Date must be ' . dateInFuture );
            assert.equal( result.contractAddress, thirdProjectTokenContractAddress, 'Contract Address must be ' . thirdProjectTokenContractAddress );
            assert.equal( result.billingAddress, thirdProjectTokenBillingAddress, 'Billing Address must be ' . thirdProjectTokenBillingAddress );
            assert.equal( result.firstPayoutInPercent, thirdProjectPercent, 'Percent must be ' . thirdProjectPercent );
            assert.equal( result.tokenPrice, thirdProjectTokenPrice, 'Token Price must be ' . thirdProjectTokenPrice );
            assert.equal( result.draw, false, 'Drawn must be false' );
        });

        it('edit first project', async () => {
            await crowdfunding.updateProject(
                firstProjectId, firstProjectName + '_a', firstProjectRaiseGoal + 1, dateInPast, firstProjectTokenContractAddress, firstProjectTokenBillingAddress, firstProjectPercent, firstProjectTokenPrice + 2
            );
            result = await crowdfunding.getProject(firstProjectId);
            assert.equal( result.id, firstProjectId, 'Id must be ' . firstProjectId );
            assert.equal( result.name, firstProjectName + '_a', 'Name must be ' . firstProjectName + '_a' );
            assert.equal( result.raiseGoal, firstProjectRaiseGoal + 1, 'Market Cap must be ' . firstProjectRaiseGoal + 1 );
            assert.equal( result.endDate, dateInPast, 'End Date must be ' . dateInPast );
            assert.equal( result.contractAddress, firstProjectTokenContractAddress, 'Contract Address must be ' . firstProjectTokenContractAddress );
            assert.equal( result.billingAddress, firstProjectTokenBillingAddress, 'Billing Address must be ' . firstProjectTokenBillingAddress );
            assert.equal( result.firstPayoutInPercent, firstProjectPercent, 'Percent must be ' . firstProjectPercent );
            assert.equal( result.tokenPrice, firstProjectTokenPrice + 2, 'Token Price must be ' . firstProjectTokenPrice + 2 );
            assert.equal( result.draw, false, 'Drawn must be false' );
        });

        it('Import Address to Whitelist in Close project with check end date', async () => {
            try{
                await crowdfunding.addUsersToWhitelist(firstProjectId, [userA, userB], true);
            }catch(error){
                assert.equal(error.reason, 'Project is close.');
                result = await crowdfunding.getUserCount(firstProjectId);
                assert.equal( result.toString(), 0, 'Count must be 0' );
            }
        });

        it('Import Address to Whitelist in Close project without check end date', async () => {
            firstProjectUsers = [userA, userB];
            await crowdfunding.addUsersToWhitelist(firstProjectId, firstProjectUsers, false);
            result = await crowdfunding.getUserCount(firstProjectId);
            assert.equal(result.toString(), firstProjectUsers.length, 'Count must be 2')
        });

        it('Check user Count in Project whitelist', async () => {
            result = await crowdfunding.getUserCount(firstProjectId);
            assert.equal(result.toString(), firstProjectUsers.length, 'Count must be 2')
        });

        it('Check user Address in Project whitelist', async () => {
            const count = await crowdfunding.getUserCount(firstProjectId);
            assert.equal(count, firstProjectUsers.length, 'Count for array must be 2')

            for (const user of firstProjectUsers) {
                result = await crowdfunding.getProjectUser(firstProjectId, user);
                assert.equal(result.userAddress, user, 'This address must be: ' + user)
            }
        });

        it('Remove Address from Whitelist', async () => {
            let count = await crowdfunding.getUserCount(firstProjectId);
            assert.equal(count, firstProjectUsers.length, 'Count for array must be 2')

            const addedUsers = [userA, userB];
            for (const user of addedUsers) {
                result = await crowdfunding.getProjectUser(firstProjectId, user);
                assert.equal(result.userAddress, user, 'This address must be: ' + user)
            }

            await crowdfunding.removeUsersFromWhitelist(firstProjectId, [userA]);
            firstProjectUsers.splice(firstProjectUsers.indexOf(userA), 1);

            count = await crowdfunding.getUserCount(firstProjectId);
            assert.equal(count.toString(), firstProjectUsers.length, 'Count for array must be 1')
        });

        it('Import Address to Second Whitelist', async () => {
            secondProjectUsers = [userC, userD, userE];
            await crowdfunding.addUsersToWhitelist(secondProjectId, secondProjectUsers, false);
            result = await crowdfunding.getUserCount(secondProjectId);
            assert.equal(result.toString(), secondProjectUsers.length, 'Count must be ' + secondProjectUsers.length)
        });

        it('Import Address to Second Whitelist if Address Exist', async () => {
            result = await crowdfunding.getUserCount(secondProjectId);
            assert.equal(result.toString(), secondProjectUsers.length, 'Count before insert must be ' + secondProjectUsers.length)

            await crowdfunding.addUsersToWhitelist(secondProjectId, [userD], false);

            result = await crowdfunding.getUserCount(secondProjectId);
            assert.equal(result.toString(), secondProjectUsers.length, 'Count after insert must be ' + secondProjectUsers.length)
        });

        it('Import Address to third Whitelist', async () => {
            thirdProjectUsers = [userF];
            await crowdfunding.addUsersToWhitelist(thirdProjectId, thirdProjectUsers, false);
            result = await crowdfunding.getUserCount(thirdProjectId);
            assert.equal(result.toString(), thirdProjectUsers.length, 'Count must be ' + thirdProjectUsers.length)
        });

        it('Remove project', async () => {
            await crowdfunding.removeProject(firstProjectId);
            firstProjectUsers = [];
            result = await crowdfunding.getProject(firstProjectId);
            assert.equal( result.id, 0, 'Id must be 0' );
            assert.equal( result.name, 0, 'Name must be 0');
            assert.equal( result.raiseGoal, 0, 'Id must be 0');
            assert.equal( result.endDate, '0', 'end Date must be 0');
            assert.equal( result.contractAddress, '0x0000000000000000000000000000000000000000', 'Contract Address must be 0x0000000000000000000000000000000000000000' );
            assert.equal( result.billingAddress, '0x0000000000000000000000000000000000000000', 'Billing Address must be 0x0000000000000000000000000000000000000000' );
            assert.equal( result.firstPayoutInPercent, 0, 'Percent must be 0');
            assert.equal( result.tokenPrice, '0', 'Token Price must be 0' );
            assert.equal( result.draw, false, 'Drawn must be false' );
        });

        it('Check user Count in First Project whitelist after Remove', async () => {
            result = await crowdfunding.getUserCount(firstProjectId);
            assert.equal(result.toString(), firstProjectUsers.length, 'Count must be 0')
        });

        it('Check user Count in Second Project whitelist after Remove', async () => {
            result = await crowdfunding.getUserCount(secondProjectId);
            assert.equal(result.toString(), secondProjectUsers.length, 'Count must be 3')
        });

        it('Check user Address in Second Project whitelist', async () => {
            const count = await crowdfunding.getUserCount(secondProjectId);
            assert.equal(count, secondProjectUsers.length, 'Count for array must be 3')

            for (const user of secondProjectUsers) {
                result = await crowdfunding.getProjectUser(secondProjectId, user);
                assert.equal(result.userAddress, user, 'This address must be: ' + user)
            }
        });

        it('Check user Count in Third Project whitelist after Remove', async () => {
            result = await crowdfunding.getUserCount(thirdProjectId);
            assert.equal(result.toString(), thirdProjectUsers.length, 'Count must be 1')
        });

        it('Check user Address in Third Project whitelist', async () => {
            const count = await crowdfunding.getUserCount(thirdProjectId);
            assert.equal(count, thirdProjectUsers.length, 'Count for array must be 1')

            for (const user of thirdProjectUsers) {
                result = await crowdfunding.getProjectUser(thirdProjectId, user);
                assert.equal(result.userAddress, user, 'This address must be: ' + user)
            }
        });
    });

    // Test 3
    describe('User functions', async () => {
        let result;

        it('Sign up to Open Whitelist', async () => {
            result = await crowdfunding.getUserCount(thirdProjectId);
            assert.equal(result.toString(), 1, 'Count for array must be 1')

            await crowdfunding.signUpToWhitelist(thirdProjectId, {from: userA});

            result = await crowdfunding.getUserCount(thirdProjectId);
            assert.equal(result.toString(), 2, 'Count for array must be 2')
        });

        it('Second Sign up to Open Whitelist', async () => {
            result = await crowdfunding.getUserCount(thirdProjectId);
            assert.equal(result.toString(), 2, 'Count for array must be 2')

            try {
                await crowdfunding.signUpToWhitelist(thirdProjectId, {from: userA});
                assert.equal(true, false, 'Error: Second Sign up to Open Whitelist');
            } catch(error) {
                assert.equal(error.reason, 'User is already in whitelist.');
                result = await crowdfunding.getUserCount(thirdProjectId);
                assert.equal(result.toString(), 2, 'Count for array must be 2')
            }
        });

        it('Sign out from Open Whitelist', async () => {
            result = await crowdfunding.getUserCount(thirdProjectId);
            assert.equal(result.toString(), 2, 'Count for array must be 2')

            await crowdfunding.logoutFromWhitelist(thirdProjectId, {from: userA});

            result = await crowdfunding.getUserCount(thirdProjectId);
            assert.equal(result.toString(), 1, 'Count for array must be 1')
        });

        it('Second sign out from Open Whitelist', async () => {
            result = await crowdfunding.getUserCount(thirdProjectId);
            assert.equal(result.toString(), 1, 'Count for array must be 1')

            try{
                await crowdfunding.logoutFromWhitelist(thirdProjectId, {from: userA});
            }catch(error){
                assert.equal(error.reason, 'Project is close.');
                result = await crowdfunding.getUserCount(thirdProjectId);
                assert.equal(result.toString(), 1, 'Count for array must be 1')
            }
        });

        it('Create new project', async () => {
            await crowdfunding.createProject(
                fourthProjectId, thirdProjectName+ '_a', thirdProjectRaiseGoal, dateInFuture, firstProjectTokenContractAddress, firstProjectTokenBillingAddress, firstProjectPercent,thirdProjectTokenPrice
            );
            result = await crowdfunding.getProject(fourthProjectId);
            assert.equal( result.id, fourthProjectId, 'Id must be ' . fourthProjectId );
            assert.equal( result.name, thirdProjectName + '_a', 'Name must be ' . thirdProjectName + '_a');
            assert.equal( result.raiseGoal, thirdProjectRaiseGoal, 'Market Cap must be ' . thirdProjectRaiseGoal );
            assert.equal( result.endDate, dateInFuture, 'End Date must be ' . dateInFuture );
            assert.equal( result.contractAddress, firstProjectTokenContractAddress, 'Contract Address must be ' . firstProjectTokenContractAddress );
            assert.equal( result.billingAddress, firstProjectTokenBillingAddress, 'Billing Address must be ' . firstProjectTokenBillingAddress );
            assert.equal( result.firstPayoutInPercent, firstProjectPercent, 'Billing Address must be ' . firstProjectPercent );
            assert.equal( result.tokenPrice, thirdProjectTokenPrice, 'Token Price must be ' . thirdProjectTokenPrice );
            assert.equal( result.draw, false, 'Drawn must be false' );
        });

        // Sign up to Second Whitelist
        it('Sign up to Fourth Whitelist', async () => {
            result = await crowdfunding.getUserCount(fourthProjectId);
            assert.equal(result.toString(), 0, 'Count for array must be 0')

            await crowdfunding.signUpToWhitelist(fourthProjectId, {from: userA});

            result = await crowdfunding.getUserCount(fourthProjectId);
            assert.equal(result.toString(), 1, 'Count for array must be 1')
        });

        it('Second Sign up to Fourth Whitelist', async () => {
            result = await crowdfunding.getUserCount(fourthProjectId);
            assert.equal(result.toString(), 1, 'Count for array must be 1')

            try{
                await crowdfunding.signUpToWhitelist(fourthProjectId, {from: userA});
            }catch(error){
                assert.equal(error.reason, 'User is already in whitelist.');
                result = await crowdfunding.getUserCount(fourthProjectId);
                assert.equal(result.toString(), 1, 'Count for array must be 1')
            }
        });

        it('Sign out from Open Whitelist', async () => {
            result = await crowdfunding.getUserCount(fourthProjectId);
            assert.equal(result.toString(), 1, 'Count for array must be 1')

            await crowdfunding.logoutFromWhitelist(fourthProjectId, {from: userA});

            result = await crowdfunding.getUserCount(fourthProjectId);
            assert.equal(result.toString(), 0, 'Count for array must be 0')
        });

        it('Second sign out from Open Whitelist', async () => {
            result = await crowdfunding.getUserCount(fourthProjectId);
            assert.equal(result.toString(), 0, 'Count for array must be 0')

            try{
                await crowdfunding.logoutFromWhitelist(fourthProjectId, {from: userA});
            }catch(error){
                assert.equal(error.reason, 'Project is close.');
                result = await crowdfunding.getUserCount(fourthProjectId);
                assert.equal(result.toString(), 0, 'Count for array must be 0')
            }
        });

        // Sign up to end whitelist
        it('edit second project', async () => {
            await crowdfunding.updateProject(
                secondProjectId, secondProjectName, secondProjectRaiseGoal, dateInPast, secondProjectTokenContractAddress, secondProjectTokenBillingAddress, firstProjectPercent, secondProjectTokenPrice
            );
            result = await crowdfunding.getProject(secondProjectId);
            assert.equal( result.endDate, dateInPast, 'End Date must be ' . dateInPast );
        });

        it('Sign up to ended Whitelist', async () => {
            result = await crowdfunding.getUserCount(secondProjectId);
            assert.equal(result.toString(), 3, 'Count for array must be 3')

            try{
                await crowdfunding.signUpToWhitelist(secondProjectId, {from: userA});
            }catch(error){
                assert.equal(error.reason, 'Project is close.');
                result = await crowdfunding.getUserCount(secondProjectId);
                assert.equal(result.toString(), 3, 'Count for array must be 3')
            }
        });
    });

    // Test 4
    describe('Change Crowdfunding values', async () => {
        it('change default tierOne value', async () => {
            const value = await crowdfunding.tierOne();
            await crowdfunding.changeTierOne(parseInt(value.toString()) + 1)
            newValue = await crowdfunding.tierOne();
            assert.equal(newValue, 50001, 'default Tier One set to 50001');
        });
        it('change default tierOneTicketValue value', async () => {
            const value = await crowdfunding.tierOneTicketValue();
            await crowdfunding.changeTierOneTicketValue(parseInt(value.toString()) + 1)
            newValue = await crowdfunding.tierOneTicketValue();
            assert.equal(newValue.toString(), 1001, 'default Tier One Ticket Value set to 1001');
        });
        it('change default tierTwo value', async () => {
            const value = await crowdfunding.tierTwo();
            await crowdfunding.changeTierTwo(parseInt(value.toString()) + 1)
            newValue = await crowdfunding.tierTwo();
            assert.equal(newValue.toString(), 20001, 'default Tier Two set to 20001');
        });
        it('change default tierTwoTicketValue value', async () => {
            const value = await crowdfunding.tierTwoTicketValue();
            await crowdfunding.changeTierTwoTicketValue(parseInt(value.toString()) + 1)
            newValue = await crowdfunding.tierTwoTicketValue();
            assert.equal(newValue.toString(), 501, 'default Tier Two Ticket Value set to 501');
        });
        it('change default tierThree value', async () => {
            const value = await crowdfunding.tierThree();
            await crowdfunding.changeTierThree(parseInt(value.toString()) + 1)
            newValue = await crowdfunding.tierThree();
            assert.equal(newValue.toString(), 10001, 'default Tier Three set to 10001');
        });
        it('change default tierThreeTicketValue value', async () => {
            const value = await crowdfunding.tierThreeTicketValue();
            await crowdfunding.changeTierThreeTicketValue(parseInt(value.toString()) + 1)
            newValue = await crowdfunding.tierThreeTicketValue();
            assert.equal(newValue.toString(), 251, 'default Tier Three Ticket Value set to 251');
        });
    });

    // Test 5
    describe('Crowdfunding lottery', async () => {
        let projectUsers, lotteryWinners = [];

        it('Lets stake everybody!', async () => {
            let result;
            // first approve tokens to be staked
            await aniaToken.approve(tokenStaking.address, tokenConvert('50000'), {
                from: userA,
            });
            // stake tokens
            await tokenStaking.stakeTokens(tokenConvert('50000'), { from: userA });

            // check balance of user
            result = await aniaToken.balanceOf(userA);
            assert.equal(
            result.toString(),
            tokenConvert('2000'),
            'UserA balance after staking 2000'
            );

            // first approve tokens to be staked
            await aniaToken.approve(tokenStaking.address, tokenConvert('10000'), {
                from: userB,
            });
            // stake tokens
            await tokenStaking.stakeTokens(tokenConvert('10000'), { from: userB });

            // check balance of user
            result = await aniaToken.balanceOf(userB);
            assert.equal(
                result.toString(),
                tokenConvert('5000'),
                'UserB balance after staking 5000'
            );

            // first approve tokens to be staked
            await aniaToken.approve(tokenStaking.address, tokenConvert('10000'), {
                from: userC,
            });
            // stake tokens
            await tokenStaking.stakeTokens(tokenConvert('10000'), { from: userC });

            // check balance of user
            result = await aniaToken.balanceOf(userC);
            assert.equal(
                result.toString(),
                tokenConvert('2500'),
                'UserC balance after staking 2500'
            );

            // first approve tokens to be staked
            await aniaToken.approve(tokenStaking.address, tokenConvert('15000'), {
                from: userD,
            });
            // stake tokens
            await tokenStaking.stakeTokens(tokenConvert('15000'), { from: userD });

            // check balance of user
            result = await aniaToken.balanceOf(userD);
            assert.equal(
                result.toString(),
                tokenConvert('3000'),
                'UserD balance after staking 3000'
            );

            // first approve tokens to be staked
            await aniaToken.approve(tokenStaking.address, tokenConvert('40000'), {
                from: userE,
            });
            // stake tokens
            await tokenStaking.stakeTokens(tokenConvert('40000'), { from: userE });

            // check balance of user
            result = await aniaToken.balanceOf(userE);
            assert.equal(
                result.toString(),
                tokenConvert('2000'),
                'UserE balance after staking 2000'
            );

            // first approve tokens to be staked
            await aniaToken.approve(tokenStaking.address, tokenConvert('36000'), {
                from: userF,
            });
            // stake tokens
            await tokenStaking.stakeTokens(tokenConvert('36000'), { from: userF });

            // check balance of user
            result = await aniaToken.balanceOf(userF);
            assert.equal(
                result.toString(),
                tokenConvert('0'),
                'UserF balance after staking 0'
            );
        });

        it('Lets whitelist everybody!', async () => {
            await crowdfunding.createProject(
                fifthProjectId, fifthProjectName, fifthProjectRaiseGoal, dateInFuture, testToken.address, fifthProjectTokenBillingAddress, fifthProjectPercent, tokenConvert(`${fifthProjectTokenPrice}`)
            );

            projectUsers = [userA, userB, userC, userD, userE, userF];

            await crowdfunding.addUsersToWhitelist(fifthProjectId, projectUsers, false);
            const result = await crowdfunding.getUserCount(fifthProjectId);
            assert.equal(result.toString(), projectUsers.length, 'Count must be ' + projectUsers.length);
        });

        it('Get project Stake cap', async () => {
            const projectStakeCap = await crowdfunding.getProjectStakeCap(fifthProjectId);
            assert.equal(projectStakeCap.toString(), 1754, 'Current Stake cap is 1754');
        });

        it('Check project cap fulfill', async () => {
            const project = await crowdfunding.getProject(fifthProjectId);
            const projectStakeCap = await crowdfunding.getProjectStakeCap(fifthProjectId);
            let result = false;
            if (projectStakeCap.toString() >= project.raiseGoal) {
                result = true;
            }
            assert.equal(result, true, 'Project cap has been fulfilled');
        });

        it('Set the random winners of the lottery', async () => {
            // Close the project
            await crowdfunding.updateProject(
                fifthProjectId, fifthProjectName, fifthProjectRaiseGoal, dateInPast, testToken.address, fifthProjectTokenBillingAddress, fifthProjectPercent, tokenConvert(`${fifthProjectTokenPrice}`)
            );

            const shuffledAdepts = projectUsers.sort(() => 0.5 - Math.random());

            const project = await crowdfunding.getProject(fifthProjectId);

            let projectLeftCap = project.raiseGoal;
            for (const user of shuffledAdepts) {
                const value = await crowdfunding.getUserTicketValue(user);
                if (value > 0) {
                    if (projectLeftCap - value >= 0) {
                        lotteryWinners.push(user);
                        projectLeftCap -= value;
                    } else {
                        break;
                    }
                }
            }

            await crowdfunding.lotteryDraw(fifthProjectId, lotteryWinners);
            const lotteryWinnerCount = await crowdfunding.getLotteryWinnerCount(fifthProjectId);

            assert.equal(lotteryWinnerCount, lotteryWinners.length, 'Randomly chosen project lottery winners has been successfully set');
        });

        it('Check the status of the winners token', async () => {
            const project = await crowdfunding.getProject(fifthProjectId);

            for (const winner of lotteryWinners) {

                const blockchainWinner = await crowdfunding.getLotteryWinner(project.id, winner);
                assert.equal(!blockchainWinner.claimed, true, 'Everyone can claim their reward');

                const tokensForBuy = blockchainWinner.reward / tokenConvertBack(project.tokenPrice);
                let status = false;

                try {
                    await crowdfunding.checkBuy(project.id, tokenConvert(tokensForBuy.toString()), { from: blockchainWinner.userAddress });
                    status = true;
                } catch (error) {
                    console.error(error);
                }

                assert.equal(status, true, 'Everyone can buy the the amounts of tokens they won');
            }
        });

        it('Buy the tokens with same addresses', async () => {
            await crowdfunding.updateProject(
                fifthProjectId, fifthProjectName, fifthProjectRaiseGoal, dateInPast, testToken.address, testToken.address, fifthProjectPercent, tokenConvert(`${fifthProjectTokenPrice}`)
            );

            const projectId = fifthProjectId;
            const project = await crowdfunding.getProject(projectId);

            const winner = await crowdfunding.getLotteryWinner(project.id, lotteryWinners[0]);
            const balanceBefore = await crowdfunding.anyoneTokenBalance(project.contractAddress, winner.userAddress);
            assert.equal(
                balanceBefore.toString(),
                0,
                'Winner balance before buy 0'
            );

            // Try to withdraw reward, the transaction should fail because BUSD address is not available
            try{
                // first approve busd tokens to be send
                await testBusd.approve(crowdfunding.address, tokenConvert(winner.reward.toString()), {
                    from: winner.userAddress,
                });
                await crowdfunding.buy(projectId, winner.reward, testBusd.address, { from: winner.userAddress });
                assert.equal(true, false, 'Before pay we must add BUSD address to stableCoins');
            }catch(error){
                assert.equal(error.reason, 'This Token is not available for payment');
            }


            // We must enabled BUSD address for payment
            await crowdfunding.setStableCoin(testBusd.address, true);

            // Try to withdraw reward, the transaction should fail because contractAddress is same as billingAddress
            try {
                await crowdfunding.buy(projectId, winner.reward, testBusd.address, { from: winner.userAddress });
                assert.equal(true, false, 'You cant withdraw if Billing Address is same as Contract Address');
            } catch (error) {
                assert.equal(error.reason, 'Billing Address must be different as Contract Address');
            }
        });

        it('Second winner buy the tokens', async () => {
            await crowdfunding.updateProject(
                fifthProjectId, fifthProjectName, fifthProjectRaiseGoal, dateInPast, testToken.address, fifthProjectTokenBillingAddress, fifthProjectPercent, tokenConvert(`${fifthProjectTokenPrice}`)
            );
            const projectId = fifthProjectId;
            const project = await crowdfunding.getProject(projectId);

            let winner = await crowdfunding.getLotteryWinner(project.id, lotteryWinners[1]);

            const userPayBalanceBefore = await testBusd.balanceOf(winner.userAddress)
            const contractPayBalanceBefore = await testBusd.balanceOf(project.billingAddress);

            // check balance of user
            const balanceBefore = await crowdfunding.anyoneTokenBalance(project.contractAddress, winner.userAddress);
            assert.equal(
                balanceBefore.toString(),
                0,
                'Winner balance before buy 0'
            );

            // first approve busd tokens to be send
            await testBusd.approve(crowdfunding.address, tokenConvert(winner.reward.toString()), {
                from: winner.userAddress,
            });

            await crowdfunding.buy(projectId, winner.reward, testBusd.address, { from: winner.userAddress });

            winner = await crowdfunding.getLotteryWinner(project.id, winner.userAddress);
            const claimAvailable = winner.claimed;

            assert.equal(!claimAvailable, false, 'Winner claimed their reward');

            // check balance of user
            const balanceAfter = await crowdfunding.anyoneTokenBalance(project.contractAddress, winner.userAddress);
            const tokensForBuy = winner.reward / tokenConvertBack(project.tokenPrice);
            const tokensForBuyPercAward = parseFloat(tokensForBuy * project.firstPayoutInPercent / 100).toFixed(1);
            assert.equal(
                parseFloat(tokenConvertBack(balanceAfter.toString())).toFixed(1),
                tokensForBuyPercAward,
                'Winner balance after buy ' + tokensForBuyPercAward
            );

            const userPayBalanceAfter = await testBusd.balanceOf(winner.userAddress);
            const contractPayBalanceAfter = await testBusd.balanceOf(project.billingAddress);

            assert.equal(
                parseFloat(tokenConvertBack(userPayBalanceAfter.toString())).toFixed(1),
                (parseFloat(tokenConvertBack(userPayBalanceBefore.toString())) - parseFloat(winner.reward.toString())).toFixed(1),
                'User paid ' + winner.reward.toString() + ' BUSD.'
            );

            assert.equal(
                parseFloat(tokenConvertBack(contractPayBalanceAfter.toString())).toFixed(1),
                (parseFloat(tokenConvertBack(contractPayBalanceBefore.toString())) + parseFloat(winner.reward.toString())).toFixed(1),
                'Contract got paid ' + winner.reward.toString() + ' BUSD.'
            );

            const claimStatus = await crowdfunding.getLotteryWinner(projectId, winner.userAddress);
            assert.equal(
                claimStatus.claimed,
                true,
                'Claimed status should be true after withdraw reward.'
            );

            // Try to withdraw reward again, the transaction should fail because reward is already claimed
            try {
                await crowdfunding.buy(projectId, winner.reward, testBusd.address, { from: winner.userAddress });
                assert.equal(true, false, 'You cant withdraw reward multiple times');
            } catch (error) {
                assert.equal(error.reason, 'User already claimed the reward');
            }
        });

        it('Check raised goal', async () => {
            const project = await crowdfunding.getProject(fifthProjectId);

            let spentMoney = 0;
            for (const winner of lotteryWinners) {
                const blockchainWinner = await crowdfunding.getLotteryWinner(project.id, winner);
                if (blockchainWinner.claimed) {
                    spentMoney += parseInt(blockchainWinner.reward);
                }
            }

            const raisedGoal = await crowdfunding.getProjectRaisedAmount(project.id);

            assert.equal(spentMoney.toString(), raisedGoal.toString(), 'Project raised goal is ' + parseInt(raisedGoal) / project.raiseGoal * 100 + '%');
        });

        it('Withdraw the rest of the tokens from the project', async () => {
            const userBalanceBefore = await testToken.balanceOf(userA);
            const userBalanceBeforeConverted = tokenConvertBack(userBalanceBefore.toString());
            const projectBalanceBefore = await testToken.balanceOf(crowdfunding.address);
            const projectBalanceBeforeConverted = tokenConvertBack(projectBalanceBefore.toString());

            await crowdfunding.withdrawTokens(fifthProjectId, userA);

            const projectBalanceAfter = await testToken.balanceOf(crowdfunding.address);

            assert.equal(projectBalanceAfter.toString(), '0', 'Project sent back all tokens');

            const userBalanceAfter = await testToken.balanceOf(userA);
            const userBalanceAfterConverted = tokenConvertBack(userBalanceAfter.toString());
            const sum = parseInt(userBalanceBeforeConverted) + parseInt(projectBalanceBeforeConverted);

            assert.equal(parseInt(userBalanceAfterConverted), sum, 'Project sent back all tokens');
        });
    });

    // Test 6
});
