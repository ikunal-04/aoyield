local json = require('json')

-- Define initial values
if not Balances then Balances = { [ao.id] = tonumber(100000) } end

-- Set Token Details
if Name ~= 'YieldCoin' then Name = 'YieldCoin' end
if Ticker ~= 'YCOIN' then Ticker = 'YCOIN' end
if Symbol ~= 'YCOIN' then Symbol = 'YCOIN' end
if Logo ~= 'https://example.com/logo.png' then Logo = 'https://example.com/logo.png' end
if Denomination ~= 0 then Denomination = 0 end

-- Yield Pool Configurations
local YieldRate = 0.05    -- 5% yield per period (modify as needed)
local YieldPeriod = 60000 -- Time period for yield calculation, e.g., 60 seconds

-- Define data structures
if not Deposits then Deposits = {} end

-- Initialize Stakers table if it doesn't exist
if not Stakers then Stakers = {} end

Handlers.add('userInfo', Handlers.utils.hasMatchingTag('Action', 'UserInfo'), function(msg)
    local user = msg.From
    local userData = {
        Balance = Balances[user] or 0,
        Staked = 0,
        Deposit = 0,
        AccumulatedYield = 0
    }

    -- Check if user has staked tokens
    if Stakers[user] then
        userData.Staked = Stakers[user].staked or 0
    end

    -- Check if user has active deposits
    if Deposits[user] then
        userData.Deposit = Deposits[user].Amount or 0
        userData.AccumulatedYield = Deposits[user].AccumulatedYield or 0
    end

    local success, encodedData = pcall(json.encode, userData)
    if not success then
        return ao.send({
            Target = msg.From,
            Action = 'UserInfo-Error',
            Error = 'Failed to encode user data'
        })
    end

    ao.send({
        Target = msg.From,
        Action = 'UserInfo-Success',
        Data = encodedData
    })
end)

Handlers.add('deposit', Handlers.utils.hasMatchingTag('Action', 'Deposit'), function(msg)
    assert(type(msg.Quantity) == 'string', 'Quantity is required!')

    local quantity = tonumber(msg.Quantity)
    local depositor = msg.From

    -- Ensure sufficient balance for deposit
    assert(Balances[depositor] and Balances[depositor] >= quantity, 'Insufficient Balance to deposit')

    -- Deduct deposit amount from user's balance and add to pool
    Balances[depositor] = Balances[depositor] - quantity
    Balances[ao.id] = (Balances[ao.id] or 0) + quantity

    -- Track deposit details
    Deposits[depositor] = {
        Amount = (Deposits[depositor] and Deposits[depositor].Amount or 0) + quantity,
        DepositTime = tonumber(msg.Timestamp),
        AccumulatedYield = (Deposits[depositor] and Deposits[depositor].AccumulatedYield or 0)
    }

    ao.send({
        Target = msg.From,
        Tags = {
            Action = 'Deposit-Success',
            QuantityDeposited = tostring(quantity)
        }
    })
end)

Handlers.add('claimYield', Handlers.utils.hasMatchingTag('Action', 'ClaimYield'), function(msg)
    local depositor = msg.From
    local deposit = Deposits[depositor]

    -- Check if user has an active deposit
    assert(deposit, 'No deposit found for user')

    -- Calculate time difference since last yield calculation
    local currentTime = tonumber(msg.Timestamp)
    local timeElapsed = currentTime - deposit.DepositTime
    local periods = math.floor(timeElapsed / YieldPeriod)

    -- Calculate yield and update deposit record
    local yieldAmount = periods * (deposit.Amount * YieldRate)
    deposit.AccumulatedYield = deposit.AccumulatedYield + yieldAmount
    deposit.DepositTime = currentTime -- Reset deposit time to avoid double-counting

    -- Transfer accumulated yield to user
    Balances[depositor] = Balances[depositor] + deposit.AccumulatedYield
    deposit.AccumulatedYield = 0

    ao.send({
        Target = msg.From,
        Tags = {
            Action = 'ClaimYield-Success',
            YieldClaimed = tostring(yieldAmount),
            TotalBalance = tostring(Balances[depositor])
        }
    })
end)

Handlers.add('withdraw', Handlers.utils.hasMatchingTag('Action', 'Withdraw'), function(msg)
    local depositor = msg.From
    local deposit = Deposits[depositor]

    assert(deposit, 'No deposit found for user')

    -- Calculate and claim yield before withdrawal
    local currentTime = tonumber(msg.Timestamp)
    local timeElapsed = currentTime - deposit.DepositTime
    local periods = math.floor(timeElapsed / YieldPeriod)

    -- Calculate yield
    local yieldAmount = periods * (deposit.Amount * YieldRate)
    deposit.AccumulatedYield = deposit.AccumulatedYield + yieldAmount

    -- Transfer accumulated yield to user
    Balances[depositor] = (Balances[depositor] or 0) + deposit.AccumulatedYield

    -- Transfer original deposit back to user
    Balances[depositor] = Balances[depositor] + deposit.Amount
    Balances[ao.id] = Balances[ao.id] - deposit.Amount

    local totalWithdrawn = deposit.Amount + deposit.AccumulatedYield

    ao.send({
        Target = msg.From,
        Tags = {
            Action = 'Withdraw-Success',
            AmountWithdrawn = tostring(deposit.Amount),
            YieldClaimed = tostring(deposit.AccumulatedYield),
            TotalWithdrawn = tostring(totalWithdrawn),
            TotalBalance = tostring(Balances[depositor])
        }
    })

    -- Clear user's deposit record
    Deposits[depositor] = nil
end)

-- Cron to automate yield calculations and distributions
Handlers.add(
    "CronTick",                                      -- handler name
    Handlers.utils.hasMatchingTag("Action", "Cron"), -- handler pattern to identify cron message
    function(msg)
        for user, deposit in pairs(Deposits) do
            local currentTime = tonumber(msg.Timestamp)
            local timeElapsed = currentTime - deposit.DepositTime
            local periods = math.floor(timeElapsed / YieldPeriod)

            -- Calculate yield for each depositor
            if periods > 0 then
                local yieldAmount = periods * (deposit.Amount * YieldRate)
                deposit.AccumulatedYield = deposit.AccumulatedYield + yieldAmount
                deposit.DepositTime = currentTime
            end
        end
    end
)
