// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// OpenZeppelin imports
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.3/contracts/token/ERC20/IERC20.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.3/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.3/contracts/security/ReentrancyGuard.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.3/contracts/access/Ownable.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.3/contracts/security/Pausable.sol";

contract MultiTokenStakingPro is Ownable, ReentrancyGuard, Pausable {

    struct StakeInfo {
        uint256 amount;              // Staked amount
        uint256 rewardDebt;          // Rewards already claimed
        uint256 lastBlock;           // Last block updated
        uint256 accumulatedRewards;  // Total rewards earned
    }

    struct TokenInfo {
        IERC20 stakingToken;
        IERC20 rewardToken;
        uint256 rewardRatePerBlock; // in reward token units per staking token per block
        uint256 totalStaked;
        uint256 rewardTokenBalance;
        uint8 stakingDecimals;
        uint8 rewardDecimals;
        bool exists;
    }

    mapping(address => TokenInfo) public tokenInfo;
    mapping(address => mapping(address => StakeInfo)) public stakes;

    // Events
    event TokenAdded(address indexed stakingToken, address indexed rewardToken, uint256 rewardRatePerBlock);
    event Staked(address indexed user, address indexed token, uint256 amount);
    event Withdrawn(address indexed user, address indexed token, uint256 amount);
    event RewardClaimed(address indexed user, address indexed token, uint256 amount);
    event RewardRateUpdated(address indexed token, uint256 newRate);
    event RewardTokensDeposited(address indexed token, uint256 amount);
    event RewardTokensWithdrawn(address indexed token, uint256 amount);

    constructor() {}

    // ----------------- ADMIN -----------------

    function addStakingToken(
        IERC20 _stakingToken,
        IERC20 _rewardToken,
        uint256 _rewardRatePerBlock
    ) external onlyOwner {
        require(!tokenInfo[address(_stakingToken)].exists, "Token already added");

        uint8 stakingDecimals = ERC20Decimals(address(_stakingToken));
        uint8 rewardDecimals = ERC20Decimals(address(_rewardToken));

        tokenInfo[address(_stakingToken)] = TokenInfo({
            stakingToken: _stakingToken,
            rewardToken: _rewardToken,
            rewardRatePerBlock: _rewardRatePerBlock,
            totalStaked: 0,
            rewardTokenBalance: 0,
            stakingDecimals: stakingDecimals,
            rewardDecimals: rewardDecimals,
            exists: true
        });

        emit TokenAdded(address(_stakingToken), address(_rewardToken), _rewardRatePerBlock);
    }

    function setRewardRate(address _token, uint256 newRate) external onlyOwner {
        TokenInfo storage tInfo = tokenInfo[_token];
        require(tInfo.exists, "Token not supported");
        tInfo.rewardRatePerBlock = newRate;
        emit RewardRateUpdated(_token, newRate);
    }

    function depositRewardTokens(address _token, uint256 _amount) external onlyOwner {
        TokenInfo storage tInfo = tokenInfo[_token];
        require(tInfo.exists, "Token not supported");

        tInfo.rewardToken.transferFrom(msg.sender, address(this), _amount);
        tInfo.rewardTokenBalance += _amount;

        emit RewardTokensDeposited(_token, _amount);
    }

    function withdrawExcessRewardTokens(address _token, uint256 _amount) external onlyOwner {
        TokenInfo storage tInfo = tokenInfo[_token];
        require(tInfo.exists, "Token not supported");

        uint256 excess = tInfo.rewardTokenBalance;
        require(_amount <= excess, "Insufficient excess tokens");

        tInfo.rewardTokenBalance -= _amount;
        tInfo.rewardToken.transfer(msg.sender, _amount);

        emit RewardTokensWithdrawn(_token, _amount);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function emergencyWithdrawStakingTokens(address _token, uint256 _amount) external onlyOwner {
        TokenInfo storage tInfo = tokenInfo[_token];
        require(tInfo.exists, "Token not supported");
        require(_amount <= tInfo.totalStaked, "Amount exceeds total staked");

        tInfo.stakingToken.transfer(msg.sender, _amount);
        tInfo.totalStaked -= _amount;
    }

    // ----------------- USER -----------------

    function stake(address _token, uint256 _amount) external nonReentrant whenNotPaused {
        require(_amount > 0, "Cannot stake 0");
        TokenInfo storage tInfo = tokenInfo[_token];
        require(tInfo.exists, "Token not supported");

        StakeInfo storage user = stakes[_token][msg.sender];

        uint256 pending = pendingReward(_token, msg.sender);
        if (pending > 0) {
            _claimReward(_token, user, pending, tInfo);
        }

        tInfo.stakingToken.transferFrom(msg.sender, address(this), _amount);

        user.amount += _amount;
        user.lastBlock = block.number;
        tInfo.totalStaked += _amount;

        emit Staked(msg.sender, _token, _amount);
    }

    function withdraw(address _token, uint256 _amount) external nonReentrant whenNotPaused {
        TokenInfo storage tInfo = tokenInfo[_token];
        require(tInfo.exists, "Token not supported");

        StakeInfo storage user = stakes[_token][msg.sender];
        require(user.amount >= _amount, "Not enough staked");

        uint256 pending = pendingReward(_token, msg.sender);
        if (pending > 0) {
            _claimReward(_token, user, pending, tInfo);
        }

        user.amount -= _amount;
        user.lastBlock = block.number;
        tInfo.totalStaked -= _amount;

        tInfo.stakingToken.transfer(msg.sender, _amount);
        emit Withdrawn(msg.sender, _token, _amount);
    }

    function claimReward(address _token) external nonReentrant whenNotPaused {
        TokenInfo storage tInfo = tokenInfo[_token];
        require(tInfo.exists, "Token not supported");

        StakeInfo storage user = stakes[_token][msg.sender];
        uint256 reward = pendingReward(_token, msg.sender);
        require(reward > 0, "No rewards");

        _claimReward(_token, user, reward, tInfo);
    }

    // ----------------- INTERNAL -----------------

    function _claimReward(address _token, StakeInfo storage user, uint256 reward, TokenInfo storage tInfo) internal {
        require(tInfo.rewardTokenBalance >= reward, "Insufficient reward tokens");

        user.rewardDebt += reward;
        user.accumulatedRewards += reward;
        user.lastBlock = block.number;

        tInfo.rewardTokenBalance -= reward;
        tInfo.rewardToken.transfer(msg.sender, reward);

        emit RewardClaimed(msg.sender, _token, reward);
    }

    // ----------------- VIEW -----------------

    function pendingReward(address _token, address _user) public view returns (uint256) {
        TokenInfo storage tInfo = tokenInfo[_token];
        StakeInfo storage user = stakes[_token][_user];

        if (user.amount == 0 || tInfo.rewardRatePerBlock == 0) return 0;

        uint256 blocksPassed = block.number - user.lastBlock;

        // DECIMALS SAFE, 1e18 removed
        uint256 reward = (user.amount * tInfo.rewardRatePerBlock * blocksPassed) / (10 ** tInfo.stakingDecimals);
        return reward;
    }

    function getTotalRewardsEarned(address _token, address _user) external view returns (uint256) {
        return stakes[_token][_user].accumulatedRewards;
    }

    function getRewardTokenBalance(address _token) external view returns (uint256) {
        return tokenInfo[_token].rewardTokenBalance;
    }

    function ERC20Decimals(address token) internal view returns (uint8) {
        try IERC20Metadata(token).decimals() returns (uint8 dec) {
            return dec;
        } catch {
            return 18; // default
        }
    }
}