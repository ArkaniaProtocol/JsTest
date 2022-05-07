const { assert, use } = require('chai');
const { default: Web3 } = require('web3');
const helper = require('./helpers/truffleTestHelpers');

const arkaniaProtocol = artifacts.require('ArkaniaProtocol');
const aniaStake = artifacts.require('AniaStake');

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

contract('TokenStaking', ([creator, user, stakerA, stakerB]) => {
  let aniaToken, tokenStaking;

  before(async () => {
    //Load contracts
    aniaToken = await arkaniaProtocol.new();
    tokenStaking = await aniaStake.new(aniaToken.address);

    //transfer 500k to TokenStaking
    await aniaToken.transfer(tokenStaking.address, tokenConvert('500000'));

    //sending some ANIA tokens to User at address[1] { explaining where it comes from}
    await aniaToken.transfer(user, tokenConvert('2234'), {
      from: creator,
    });

    //sending some ANIA tokens to User at address[2] { explaining where it comes from}
    await aniaToken.transfer(stakerA, tokenConvert('10000'), {
      from: creator,
    });

    //sending some ANIA tokens to User at address[3] { explaining where it comes from}
    await aniaToken.transfer(stakerB, tokenConvert('50000'), {
      from: creator,
    });
  });

  // Test 1
  // 1.1 Checking if Token contract has a same name as expected
  describe('AniaToken deployment', async () => {
    it('token deployed and has a name', async () => {
      const name = await aniaToken.name();
      assert.equal(name, 'Arkania Protocol');
    });
  });

  // Test 2
  // 2.1 Checking if TokenStaking contract has a same name as expected
  describe('TokenStaking deployment', async () => {
    it('staking contract deployed and has a name', async () => {
      const name = await tokenStaking.name();
      assert.equal(name, 'Arkania Protocol Launchpad');
    });

    //2.2 checking default apy value
    it('checking default APY value', async () => {
      const value = await tokenStaking.apy();
      assert.equal(value, '100', 'default APY set to 100');
    });

    // 2.3 Checking if TokenStaking contract has 500k of AniaTokens
    it('staking contract has 500k AniaTokens tokens inside', async () => {
      let balance = await aniaToken.balanceOf(tokenStaking.address);
      assert.equal(balance.toString(), tokenConvert('500000'));
    });
  });

  // Test 3
  // 3.1 Testing stakeTokens function
  describe('TokenStaking stakeTokens function', async () => {
    let result;
    it('users balance is correct before staking', async () => {
      result = await aniaToken.balanceOf(user);
      assert.equal(
        result.toString(),
        tokenConvert('2234'),
        'users balance is correct before staking'
      );
    });

    // 3.2 checking TokenStaking total banalce
    it('checking total staked before any stakes', async () => {
      result = await tokenStaking.getTotalStaked();
      assert.equal(
        result.toString(),
        tokenConvert('0'),
        'total staked should be 0'
      );
    });

    // 3.3 Testing stakeTokens function
    it('approving tokens, staking tokens, checking balance', async () => {
      // first approve tokens to be staked
      await aniaToken.approve(tokenStaking.address, tokenConvert('1000'), {
        from: user,
      });
      // stake tokens
      await tokenStaking.stakeTokens(tokenConvert('1000'), { from: user });

      // check balance of user if they have 0 after staking
      result = await aniaToken.balanceOf(user);
      assert.equal(
        result.toString(),
        tokenConvert('1234'),
        'User balance after staking 1234'
      );
    });

    // 3.4 checking balance of TokenStaking contract should be 500k +1000
    it('checking contract balance after staking', async () => {
      result = await aniaToken.balanceOf(tokenStaking.address);
      assert.equal(
        result.toString(),
        tokenConvert('501000'),
        'Smart contract total balance after staking 1000'
      );
    });

    // 3.5 checking TokenStaking contract users balance if greater than 0
    it('checking user balance inside contract', async () => {
      result = await tokenStaking.hasStakeWithRewards(user);
      let hasBalance = false;
      if (parseInt(result) > 0) {
        hasBalance = true;
      }
      assert.equal(
        hasBalance,
        true,
        'Smart contract balance for user is higher than 0.'
      );
    });
  });

  // Test 4
  describe('TokenStaking redistributeRewards function', async () => {
    const users = [stakerA, stakerB];
    let result;
    // 4.1 checking who can issue tokens
    it('checking who can do redistribution', async () => {
      //issue tokens function from creator
      await tokenStaking.redistributeRewards(users, { from: creator });

      //issue tokens function from user, should not be able
      await tokenStaking.redistributeRewards(users, { from: user }).should.be.rejected;
    });

    // 4.2 checking balance of TokenStaking contract after redistribution
    it('checking TokenStaking balance', async () => {
      result = await aniaToken.balanceOf(tokenStaking.address);
      assert.equal(
        result.toString(),
        tokenConvert('501000'),
        'Smart contract total balance after staking 1000'
      );
    });
  });

  // Test 5
  describe('TokenStaking unstakeTokens function', async () => {
    let result;
    // 5.1 Testing unstaking function
    it('unstaking and checking users balance after unstake', async () => {
      await tokenStaking.unstakeTokens(tokenConvert('1000'), { from: user });
      result = await aniaToken.balanceOf(user);
      const floatResult = parseFloat(tokenConvertBack(result.toString())).toFixed();
      assert.equal(
        floatResult.toString(),
        '2234',
        'User balance after unstaking 2234'
      );
    });

    // 5.2 checking TokenStaking total staked balance
    it('checking total staked', async () => {
      result = await tokenStaking.getTotalStaked();
      const floatResult = parseFloat(tokenConvertBack(result.toString())).toFixed();
      assert.equal(
        floatResult.toString(),
        '0',
        'total staked should be 0'
      );
    });
  });

  // Test 6
  describe('TokenStaking With Rewards', async () => {
    // 6.1 Staking for a few minutes
    it('Stake and take the rewards: 5 min', async() => {
      const stake_amount = 1000;
      // first approve tokens to be staked
      await aniaToken.approve(tokenStaking.address, tokenConvert(`${stake_amount}`), {
        from: stakerA,
      });
      // stake tokens
      await tokenStaking.stakeTokens(tokenConvert(`${stake_amount}`), { from: stakerA });

      await helper.advanceTimeAndBlock(300);

      // Check rewards only
      const currentRewards = await tokenStaking.hasRewards({ from: stakerA })
      const floatCurrentRewards = parseFloat(tokenConvertBack(currentRewards.toString())).toFixed(2);
      assert.equal(
          floatCurrentRewards.toString(),
          '0.01',
          'StakerA rewards is 0.01'
      );

      // Check stakes with rewards
      let currentStakesWithRewards = await tokenStaking.hasStakeWithRewards(stakerA)
      let floatCurrentStakesWithRewards = parseFloat(tokenConvertBack(currentStakesWithRewards.toString())).toFixed(2);
      assert.equal(
          floatCurrentStakesWithRewards.toString(),
          '1000.01',
          'StakerA stakes with rewards is 1000.01'
      );

      await tokenStaking.unstakeTokens(currentStakesWithRewards.toString(), { from: stakerA });

      currentStakesWithRewards = await tokenStaking.hasStakeWithRewards(stakerA)
      floatCurrentStakesWithRewards = parseFloat(tokenConvertBack(currentStakesWithRewards.toString())).toFixed();
      assert.equal(
          floatCurrentStakesWithRewards.toString(),
          '0',
          'StakerA stakes after unstake all is 0'
      );
    });

    // 6.2 Staking for a few hours
    it('Stake and take the rewards: 4 hrs', async() => {
      const stake_amount = 10000;
      // first approve tokens to be staked
      await aniaToken.approve(tokenStaking.address, tokenConvert(`${stake_amount}`), {
        from: stakerB,
      });
      // stake tokens
      await tokenStaking.stakeTokens(tokenConvert(`${stake_amount}`), { from: stakerB });

      // Make a new Stake for 10000, fast forward time and make sure stake reward is correct
      await helper.advanceTimeAndBlock(3600 * 4);

      // Check rewards only
      const currentRewards = await tokenStaking.hasRewards({ from: stakerB })
      const floatCurrentRewards = parseFloat(tokenConvertBack(currentRewards.toString())).toFixed(2);
      assert.equal(
          floatCurrentRewards.toString(),
          '4.57',
          'StakerB rewards is 4.57'
      );

      // Check stakes with rewards
      const currentStakesWithRewards = await tokenStaking.hasStakeWithRewards(stakerB)
      const floatCurrentStakesWithRewards = parseFloat(tokenConvertBack(currentStakesWithRewards.toString())).toFixed(2);
      assert.equal(
          floatCurrentStakesWithRewards.toString(),
          '10004.57',
          'StakerB balance with rewards is 10004.57'
      );

      await tokenStaking.unstakeTokens(currentStakesWithRewards.toString(), { from: stakerB });
      const result = await tokenStaking.getTotalStaked();
      const floatResult = parseFloat(tokenConvertBack(result.toString())).toFixed();
      assert.equal(
          floatResult.toString(),
          '0',
          'Total staked should be 0'
      );
    });

    // 6.3 Staking for a day
    it('Stake and take the rewards: 1 day', async() => {
      const stake_amount = 5000;
      // first approve tokens to be staked
      await aniaToken.approve(tokenStaking.address, tokenConvert(`${stake_amount}`), {
        from: stakerA,
      });
      // stake tokens
      await tokenStaking.stakeTokens(tokenConvert(`${stake_amount}`), { from: stakerA });

      // Make a new Stake for 5000, fast forward time and make sure stake reward is correct
      await helper.advanceTimeAndBlock(3600 * 24);

      // Check rewards only
      const currentRewards = await tokenStaking.hasRewards({ from: stakerA })
      const floatCurrentRewards = parseFloat(tokenConvertBack(currentRewards.toString())).toFixed(2);
      assert.equal(
          floatCurrentRewards.toString(),
          '13.70',
          'StakerA rewards is 13.70'
      );

      // Check stakes with rewards
      const currentStakesWithRewards = await tokenStaking.hasStakeWithRewards(stakerA)
      const floatCurrentStakesWithRewards = parseFloat(tokenConvertBack(currentStakesWithRewards.toString())).toFixed(2);
      assert.equal(
          floatCurrentStakesWithRewards.toString(),
          '5013.70',
          'StakerA balance with rewards is 5013.70'
      );

      await tokenStaking.unstakeTokens(currentStakesWithRewards.toString(), { from: stakerA });
      const result = await tokenStaking.getTotalStaked();
      const floatResult = parseFloat(tokenConvertBack(result.toString())).toFixed();
      assert.equal(
          floatResult.toString(),
          '0',
          'Total staked should be 0'
      );
    });

    // 6.4 Staking for a year
    it('Stake and take the rewards: 1 year', async() => {
      const stake_amount = 10000;
      // first approve tokens to be staked
      await aniaToken.approve(tokenStaking.address, tokenConvert(`${stake_amount}`), {
        from: stakerA,
      });
      // stake tokens
      await tokenStaking.stakeTokens(tokenConvert(`${stake_amount}`), { from: stakerA });

      // Make a new Stake for 10000, fast forward time and make sure staked tokens are correct
      await helper.advanceTimeAndBlock(3600 * 24 * 365);

      // Check rewards only
      const currentRewards = await tokenStaking.hasRewards({ from: stakerA })
      const floatCurrentRewards = parseFloat(tokenConvertBack(currentRewards.toString())).toFixed(3);
      assert.equal(
          floatCurrentRewards.toString(),
          '10000.000',
          'StakerA rewards is 10000.000'
      );

      // Check stakes with rewards
      const currentStakesWithRewards = await tokenStaking.hasStakeWithRewards(stakerA)
      const floatCurrentStakesWithRewards = parseFloat(tokenConvertBack(currentStakesWithRewards.toString())).toFixed(3);
      assert.equal(
          floatCurrentStakesWithRewards.toString(),
          '20000.000',
          'StakerA balance with rewards is 20000.000'
      );

      await tokenStaking.unstakeTokens(currentStakesWithRewards.toString(), { from: stakerA });
      const result = await tokenStaking.getTotalStaked();
      const floatResult = parseFloat(tokenConvertBack(result.toString())).toFixed();
      assert.equal(
          floatResult.toString(),
          '0',
          'Total staked should be 0'
      );
    });
  });

  // Test 7
  describe('APY Tests', async () => {
    const users = [stakerA, stakerB];

    // 7.1 Change APY
    it('Change APY to 23%', async() => {
      await tokenStaking.changeAPY(23, users, {
        from: creator,
        gasLimit: 1000000,
      })
      const currentApy = await tokenStaking.apy();
      assert.equal(currentApy.toString(), '23', 'APY set to 23');
    });

    // 7.2 Change APY during the stake
    it('Change APY during the stake', async() => {
      await tokenStaking.changeAPY(120, users, {
        from: creator,
        gasLimit: 1000000,
      })
      let currentApy = await tokenStaking.apy();
      assert.equal(currentApy, '120', 'APY set to 120');

      const stake_amount = 5000;
      // first approve tokens to be staked
      await aniaToken.approve(tokenStaking.address, tokenConvert(`${stake_amount}`), {
        from: stakerA,
      });
      // stake tokens
      await tokenStaking.stakeTokens(tokenConvert(`${stake_amount}`), { from: stakerA });

      // Make a new Stake for 5000, fast forward time and make sure total staked is correct
      await helper.advanceTimeAndBlock(3600 * 24 * 7);

      // Check stakes with rewards
      let currentStakesWithRewards = await tokenStaking.hasStakeWithRewards(stakerA)
      let floatCurrentStakesWithRewards = parseFloat(tokenConvertBack(currentStakesWithRewards.toString())).toFixed(2);
      assert.equal(
          floatCurrentStakesWithRewards.toString(),
          '5115.07',
          'StakerA balance with rewards is 5115.07'
      );

      await tokenStaking.changeAPY(12, [stakerA, stakerB], {
        from: creator,
        gasLimit: 1000000,
      })
      currentApy = await tokenStaking.apy();
      assert.equal(currentApy, '12', 'APY set to 12');

      // Check stakes with rewards after the changing the API
      currentStakesWithRewards = await tokenStaking.hasStakeWithRewards(stakerA)
      floatCurrentStakesWithRewards = parseFloat(tokenConvertBack(currentStakesWithRewards.toString())).toFixed(2);
      assert.equal(
          floatCurrentStakesWithRewards.toString(),
          '5115.07',
          'StakerA balance with rewards is 5115.07'
      );

      // Fast forward time once again
      await helper.advanceTimeAndBlock(3600 * 24 * 7);

      // Check stakes with rewards
      currentStakesWithRewards = await tokenStaking.hasStakeWithRewards(stakerA)
      floatCurrentStakesWithRewards = parseFloat(tokenConvertBack(currentStakesWithRewards.toString())).toFixed(2);
      assert.equal(
          floatCurrentStakesWithRewards.toString(),
          '5126.84',
          'StakerA balance with rewards is 5126.84'
      );

      await tokenStaking.unstakeTokens(currentStakesWithRewards.toString(), { from: stakerA });
      const result = await tokenStaking.getTotalStaked();
      const floatResult = parseFloat(tokenConvertBack(result.toString())).toFixed();
      assert.equal(
          floatResult.toString(),
          '0',
          'Total staked should be 0'
      );
    });
  });

  // Test 8
  describe('Multistakes', async () => {
    // 8.1 Multistake and check the TokenStaking getTotalStaked()
    it('Multistake and check the TokenStaking getTotalStaked()', async() => {
      let result = await tokenStaking.getTotalStaked();
      let floatResult = parseFloat(tokenConvertBack(result.toString())).toFixed();
      assert.equal(
          floatResult.toString(),
          '0',
          'Total staked should be 0'
      );

      let stake_amount = 1000;
      // first approve tokens to be staked
      await aniaToken.approve(tokenStaking.address, tokenConvert(`${stake_amount}`), {
        from: stakerA,
      });
      // stake tokens
      await tokenStaking.stakeTokens(tokenConvert(`${stake_amount}`), { from: stakerA });

      stake_amount = 10000;
      // first approve tokens to be staked
      await aniaToken.approve(tokenStaking.address, tokenConvert(`${stake_amount}`), {
        from: stakerB,
      });
      // stake tokens
      await tokenStaking.stakeTokens(tokenConvert(`${stake_amount}`), { from: stakerB });

      // Make a new Stakes for 1000 and 10000, fast forward time and make sure total staked is correct
      await helper.advanceTimeAndBlock(3600 * 24 * 69);

      result = await tokenStaking.getTotalStaked();
      floatResult = parseFloat(tokenConvertBack(result.toString())).toFixed();
      assert.equal(
          floatResult.toString(),
          '11000',
          'Total staked should be 11000'
      );
    });
  });
});
