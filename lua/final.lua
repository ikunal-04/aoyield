local json = require("json")

ProtocolsId = tostring(0)
User = {}

if not Stakers then Stakers = {} end
if not Unstaking then Unstaking = {} end

-- This is the token contract and it's tokens are used for aoyield. (for now)\
-- processId: "pt0dfFDOc4eJDSdhDNsSmzjdJLq_qw5gs1uCioueGn4"

Owner_Wallet = "wT2aEN3NxaN3DFRJucM51kEDVScudmURt1GsfIYpBIA"

if not Balances then Balances = { [ao.id] = 10000000000 } end

if Name ~= 'AOYIELD' then Name = 'AOYIELD' end

if Ticker ~= 'AOYIELD' then Ticker = 'AOYIELD' end

if Denomination ~= 10 then Denomination = 10 end

if not Logo then Logo = 'https://arweave.net/4DRY2jKxPAOmUS-rAtgyQHXZRcne49PL2lBHRzuPJEE' end

Handlers.add('process-mint', Handlers.utils.hasMatchingTag('Action', 'Process-Mint'), function(msg)
    assert(type(msg.Quantity) == 'string', 'Quantity is required!')

    if not Balances[ao.id] then Balances[ao.id] = tonumber("0") end

    if msg.From == ao.id then
        -- Add tokens to the token pool, according to Quantity
        Balances[msg.From] = Balances[ao.id] + msg.Quantity
        ao.send({
            Target = msg.From,
            Data = "Successfully minted " .. msg.Quantity
        })
    else
        ao.send({
            Target = msg.From,
            Action = 'Mint-Error',
            ['Message-Id'] = msg.Id,
            Error = 'Only the Process Owner can mint new ' .. Ticker .. ' tokens!'
        })
    end
end
)

Handlers.add('user-mint', Handlers.utils.hasMatchingTag('Action', 'User-Mint'), function(msg)
    local quantity = 1000
    -- Convert balance to number if it's a string
    local currentBalance = tonumber(Balances[ao.id]) or 0

    if currentBalance < quantity then
        return ao.send({
            Target = ao.id,
            Tags = {
                Action = 'ProcessStream-Error',
                Error = 'Insufficient balance'
            }
        })
    end

    Balances[ao.id] = currentBalance - quantity
    print(Balances[ao.id])
    Balances[msg.From] = (Balances[msg.From] or 0) + quantity

    print('Minted: ' .. quantity .. ' to ' .. msg.From)
    ao.send({
        Target = msg.From,
        Tags = {
            Action = 'Mint-Success',
            QuantityMinted = tostring(quantity)
        }
    })
end
)

Handlers.add('addProtocol', Handlers.utils.hasMatchingTag('Action', 'AddProtocol'), function(msg)
    -- Verify caller is owner
    assert(msg.Tags.Sender == Owner_Wallet, "Only owner can add protocols")

    -- Validate required protocol information
    assert(msg.Tags.YieldRate, "YieldRate is required")
    assert(msg.Tags.MaturityDate, "MaturityDate is required")
    assert(msg.Tags.ProtocolName, "ProtocolName is required")
    assert(msg.Tags.ProtocolLogo, "ProtocolLogo is required")

    if not Protocols then
        Protocols = {}
    end

    -- Generate new protocol ID
    ProtocolsId = #Protocols + 1

    -- Create new protocol entry
    Protocols[ProtocolsId] = {
        id = tostring(ProtocolsId),
        yieldRate = tonumber(msg.Tags.YieldRate),
        maturityDate = tonumber(msg.Tags.MaturityDate),
        tvl = 0,
        liquidity = 0,
        name = msg.Tags.ProtocolName,
        logo = msg.Tags.ProtocolLogo,
        usersCount = 0
    }

    -- Send confirmation message
    ao.send({
        Target = ao.id,
        Tags = {
            Action = "ProtocolAdded",
            ProtocolId = tostring(ProtocolsId),
            ProtocolName = msg.Tags.ProtocolName,
            YieldRate = msg.Tags.YieldRate,
            MaturityDate = msg.Tags.MaturityDate
        }
    })
end)

Handlers.add('getProtocols', Handlers.utils.hasMatchingTag('Action', 'GetProtocols'), function(msg)
    ao.send({
        Target = msg.From,
        Tags = {
            Action = "Protocols",
            Protocols = json.encode(Protocols)
        }
    })
end)

Handlers.add('getProtocol', Handlers.utils.hasMatchingTag('Action', 'GetProtocol'), function(msg)
    -- Validate protocol ID
    local protocolId = tonumber(msg.Tags.ProtocolId)
    assert(protocolId, "Invalid Protocol ID")
    assert(Protocols[protocolId], "Protocol not found")

    ao.send({
        Target = msg.From,
        Tags = {
            Action = "Protocol",
            Protocol = json.encode(Protocols[protocolId])
        }
    })
end)

Handlers.add('stake', Handlers.utils.hasMatchingTag('Action', 'Stake'), function(msg)
    -- Validate inputs
    assert(msg.Tags.ProtocolId, "Protocol ID is required")
    assert(msg.Tags.Quantity, "Quantity is required")

    local protocolId = tonumber(msg.Tags.ProtocolId)
    local quantity = tonumber(msg.Tags.Quantity)

    -- Verify protocol exists
    assert(Protocols[protocolId], "Protocol not found")
    local protocol = Protocols[protocolId]

    -- Verify user has enough balance
    assert(Balances[msg.From] and Balances[msg.From] >= quantity, "Insufficient balance to stake")

    -- Deduct tokens from user's balance
    Balances[msg.From] = Balances[msg.From] - quantity

    -- Initialize staker's entry if doesn't exist
    if not Stakers[msg.From] then
        Stakers[msg.From] = {}
    end

    local isExistingUser = false
    for _, stake in ipairs(Stakers[msg.From]) do
        if stake.protocolId == protocolId then
            isExistingUser = true
            break
        end
    end

    -- Record stake details
    table.insert(Stakers[msg.From], {
        protocolId = protocolId,
        amount = quantity,
        stakedAt = msg.Timestamp,
        maturityDate = protocol.maturityDate,
        yieldRate = protocol.yieldRate
    })

    -- Update protocol TVL and users count
    protocol.tvl = protocol.tvl + quantity
    protocol.liquidity = protocol.liquidity + quantity

    if not isExistingUser then
        protocol.usersCount = protocol.usersCount + 1
    end

    ao.send({
        Target = msg.From,
        Tags = {
            Action = "Stake-Success",
            ProtocolId = tostring(protocolId),
            Amount = tostring(quantity),
            NewLiquidity = tostring(protocol.liquidity)
        }
    })
end)

Handlers.add('processYield', Handlers.utils.hasMatchingTag('Action', 'ProcessYield'), function(msg)
    print("Processing yield for " .. msg.From)
    if not Stakers[msg.From] then
        return ao.send({
            Target = msg.From,
            Tags = {
                Action = "ProcessYield-Error",
                Error = "No stakes found for user"
            }
        })
    end

    local currentTime = tonumber(msg.Timestamp)
    local userStakes = Stakers[msg.From]
    local updatedStakes = {}
    local totalYield = 0

    for _, stake in ipairs(userStakes) do
        local protocol = Protocols[stake.protocolId]

        -- Calculate the elapsed time in days
        local timeElapsed = currentTime - stake.stakedAt
        local daysElapsed = timeElapsed / (24 * 60 * 60 * 1000)

        if currentTime < stake.maturityDate then
            -- Calculate accrued yield based on days elapsed and annual yield rate
            local accruedYield = math.floor(stake.amount * (stake.yieldRate / 100) * (daysElapsed / 365))

            stake.status = "Active"
            stake.currentYield = accruedYield
            totalYield = totalYield + accruedYield
            table.insert(updatedStakes, stake)
        elseif currentTime >= stake.maturityDate and not stake.processed then
            -- Calculate the total days from stakedAt to maturityDate
            local totalDays = (stake.maturityDate - stake.stakedAt) / (24 * 60 * 60 * 1000)
            local finalYield = math.floor(stake.amount * (stake.yieldRate / 100) * (totalDays / 365))

            -- Total return includes the initial staked amount plus the yield
            local totalReturn = stake.amount + finalYield
            Balances[msg.From] = (Balances[msg.From] or 0) + finalYield

            protocol.tvl = protocol.tvl - stake.amount
            protocol.liquidity = protocol.liquidity - stake.amount
            protocol.usersCount = protocol.usersCount - 1

            stake.status = "Matured"
            stake.finalYield = finalYield
            stake.processed = true
            stake.totalReturned = totalReturn

            ao.send({
                Target = msg.From,
                Tags = {
                    Action = 'Stake-Completed',
                    ProtocolId = tostring(stake.protocolId),
                    InitialAmount = tostring(stake.amount),
                    YieldEarned = tostring(finalYield),
                    TotalReturned = tostring(totalReturn)
                }
            })
        end
    end

    Stakers[msg.From] = updatedStakes

    ao.send({
        Target = msg.From,
        Tags = {
            Action = 'ProcessYield-Success',
            ActiveStakes = tostring(#updatedStakes),
            CurrentTotalYield = tostring(totalYield),
            Stakes = json.encode(updatedStakes)
        }
    })
end)

Handlers.add('get-user-info', Handlers.utils.hasMatchingTag('Action', 'GetUserInfo'), function(msg)
    local userStakes = Stakers[msg.From] or {}
    local totalYield = 0
    local totalStaked = 0
    local yieldRates = {}
    local consolidatedStakes = {} -- Hash table to consolidate stakes by protocol
    local currentTime = tonumber(msg.Timestamp)

    -- Consolidate stakes by protocol
    for _, stake in ipairs(userStakes) do
        local protocol = Protocols[stake.protocolId]
        local protocolId = stake.protocolId

        -- Calculate current yield for this stake
        local timeElapsed = currentTime - stake.stakedAt
        local daysElapsed = timeElapsed / (24 * 60 * 60 * 1000)
        local currentYield = math.floor(stake.amount * stake.yieldRate * daysElapsed / (365 * 100))

        if not consolidatedStakes[protocolId] then
            consolidatedStakes[protocolId] = {
                protocolId = protocolId,
                protocolName = protocol.name,
                amount = stake.amount,
                currentYield = currentYield,
                yieldRate = stake.yieldRate,
                maturityDate = stake.maturityDate,
                stakedAt = stake.stakedAt,
                status = currentTime >= stake.maturityDate and "Completed" or "Active"
            }
            table.insert(yieldRates, stake.yieldRate)
        else
            local existing = consolidatedStakes[protocolId]
            existing.amount = existing.amount + stake.amount
            existing.currentYield = existing.currentYield + currentYield
            if stake.stakedAt < existing.stakedAt then
                existing.stakedAt = stake.stakedAt
            end
        end
    end

    local formattedStakes = {}
    for _, stake in pairs(consolidatedStakes) do
        table.insert(formattedStakes, stake)
        totalStaked = totalStaked + stake.amount
        totalYield = totalYield + stake.currentYield
    end

    local minApy = 0
    local maxApy = 0
    if #yieldRates > 0 then
        table.sort(yieldRates)
        minApy = yieldRates[1]
        maxApy = yieldRates[#yieldRates]
    end

    ao.send({
        Target = msg.From,
        Tags = {
            Action = "UserStakes",
            Stakes = json.encode(formattedStakes),
            ActiveProtocols = tostring(#formattedStakes),
            TotalStaked = tostring(totalStaked),
            TotalYield = tostring(totalYield),
            MinAPY = tostring(minApy),
            MaxAPY = tostring(maxApy)
        }
    })
end)


Handlers.add(
    "CronTick",
    Handlers.utils.hasMatchingTag('Action', 'Cron'),
    function(msg)
        ao.send({
            Target = ao.id,
            Tags = {
                Action = "ProcessYield"
            }
        })
        ao.send({
            Target = ao.id,
            Tags = {
                Action = "GetUserInfo"
            }
        })
    end
)