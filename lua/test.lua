local json = require("json")

if not Balances then Balances = { [ao.id] = tonumber(10000000) } end

if Name ~= 'YieldToken' then Name = 'YieldToken' end

if Ticker ~= 'YIELD' then Ticker = 'YIELD' end

if Symbol ~= 'YLD' then Symbol = 'YLD' end

if LogoURL ~= 'https://arweave.net/2tDzQtngmg39dmOvqD0av5K0j6VeWP0YmMqPQIyXgI8' then
    LogoURL =
    'https://arweave.net/2tDzQtngmg39dmOvqD0av5K0j6VeWP0YmMqPQIyXgI8'
end

if Denomination ~= 0 then Denomination = 0 end

if not Stakers then Stakers = {} end
if not YieldPool then YieldPool = 100000 end
if not Protocols then Protocols = {} end
if not PT then PT = {} end
if not TVL then TVL = 0 end
if not MaturityDate then MaturityDate = 0 end
if not YT then YT = {} end
if not PT then PT = {} end

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
    local quantity = 5000;

    if Balances[ao.id] < quantity then
        return ao.send({
            Target = ao.id,
            Tags = {
                Action = 'ProcessStream-Error',
                Error = 'StreamId is required'
            }
        })
    end

    Balances[ao.id] = Balances[ao.id] - quantity
    Balances[msg.From] = (Balances[msg.From] or 0) + quantity
    ao.send({
        Target = msg.From,
        Action = 'Mint-Success',
        Data = 'Minted ' .. tostring(quantity) .. ' ' .. Ticker .. ' to ' .. msg.From
    })
end
)

Handlers.add('addprotocol', Handlers.utils.hasMatchingTag('Action', 'AddProtocol'), function(msg)
    if msg.From ~= ao.id then
        return ao.send({
            Target = msg.From,
            Action = 'AddProtocol-Error',
            Error = 'Only owner can add protocol.'
        })
    end

    if not msg.Tags.ProtocolName or not msg.Tags.ProtocolRate or not msg.Tags.MaturityDate or not msg.Tags.Logo then
        return ao.send({
            Target = msg.From,
            Action = 'AddProtocol-Error',
            Error = 'ProtocolName, ProtocolRate, MaturityDate and Logo are required.'
        })
    end

    local protocolName = msg.Tags.ProtocolName
    local protocolRate = tonumber(msg.Tags.ProtocolRate)

    if not protocolRate then
        return ao.send({
            Target = msg.From,
            Action = 'AddProtocol-Error',
            Error = 'ProtocolRate must be a valid number.'
        })
    end

    if not Protocols then
        Protocols = {}
    end

    Protocols[protocolName] = {
        name = protocolName,
        rate = protocolRate,
        maturityDate = msg.Tags.MaturityDate,
        logo = msg.Tags.Logo
    }

    local success, encodedData = pcall(json.encode, Protocols[protocolName])
    if not success then
        return ao.send({
            Target = msg.From,
            Action = 'AddProtocol-Error',
            Error = 'Failed to encode protocol data.'
        })
    end

    ao.send({
        Target = msg.From,
        Action = 'AddProtocol-Success',
        Data = encodedData
    })
end)

Handlers.add('stake-tokens', Handlers.utils.hasMatchingTag('Action', 'Stake-Tokens'), function(msg)
    local quantity = tonumber(msg.Quantity)
    local protocolName = msg.Tags.ProtocolName

    if not protocolName then
        return ao.send({
            Target = msg.From,
            Action = 'Stake-Tokens-Error',
            Error = 'ProtocolName is required.'
        })
    end

    if not quantity or quantity <= 0 then
        return ao.send({
            Target = msg.From,
            Action = 'Stake-Tokens-Error',
            Error = 'Quantity must be a positive number.'
        })
    end

    if not Balances[msg.From] or Balances[msg.From] < quantity then
        return ao.send({
            Target = msg.From,
            Action = 'Stake-Tokens-Error',
            Error = 'Insufficient balance.'
        })
    end

    if not Protocols[protocolName] then
        return ao.send({
            Target = msg.From,
            Action = 'Stake-Tokens-Error',
            Error = 'Protocol not found.'
        })
    end

    Balances[msg.From] = Balances[msg.From] - quantity

    if not Stakers[msg.From] then
        Stakers[msg.From] = { staked = 0, yieldEarned = 0, stakeStart = msg.Timestamp }
    end

    Stakers[msg.From].staked = Stakers[msg.From].staked + quantity
    Stakers[msg.From].stakeStart = msg.Timestamp

    if not PT[protocolName] then
        PT[protocolName] = {}
    end

    PT[protocolName][msg.From] = (PT[protocolName][msg.From] or 0) + quantity

    TVL = (TVL or 0) + quantity

    local stakerData = {
        Staker = msg.From,
        QuantityStaked = tostring(quantity),
        LPReceived = tostring(quantity),
        YTReceived = tostring(quantity),
        PTReceived = tostring(quantity),
        Protocol = protocolName
    }

    local success, encodedData = pcall(json.encode, stakerData)

    if not success then
        return ao.send({
            Target = msg.From,
            Action = 'Stake-Tokens-Error',
            Error = 'Failed to encode staker data.'
        })
    end

    ao.send({
        Target = msg.From,
        Action = 'Stake-Tokens-Success',
        Data = encodedData
    })
end)

Handlers.add('distribute-yield', Handlers.utils.hasMatchingTag('Action', 'Distribute-Yield'), function (msg)
    local staker = msg.From
    local stakerData = Stakers[staker]
    local protocolName = msg.Tags.ProtocolName

    assert(stakerData, 'Staker data not found')
    assert(Protocols[protocolName], 'Protocol not found')

    local currentTime = msg.Timestamp
    local timeElapsed = currentTime - stakerData.stakeStart

    local yieldRate = Protocols[protocolName].rate or 0.1

    local yieldEarned = stakerData.staked * yieldRate * timeElapsed

    assert(YieldPool >= yieldEarned, 'Yield earned is greater than yield pool')

    YieldPool = YieldPool - yieldEarned
    Balances[staker] = (Balances[staker] or 0) + yieldEarned
    stakerData.yieldEarned = stakerData.yieldEarned + yieldEarned
    stakerData.stakeStart = currentTime  -- Reset stake time

    ao.send({
        Target = staker,
        Action = 'Yield-Distributed',
        YieldEarned = tostring(yieldEarned),
        Protocol = protocolName
    })
end)

Handlers.add('check-maturity', Handlers.utils.hasMatchingTag('Action', 'Check-Maturity'), function(msg)
    local staker = msg.From
  local protocol = msg.Tags.ProtocolName
  local stakerData = Stakers[staker]

  assert(stakerData, 'Staker data not found')
  assert(Protocols[protocol], 'Protocol not found.')

  -- Ensure maturity date has been reached
  assert(os.time() >= MaturityDate, 'Maturity date not reached.')

  -- Unlock YT and PT tokens for staker
  local unlockedTokens = (YT[staker] or 0) + (PT[protocol][staker] or 0)
  Balances[staker] = (Balances[staker] or 0) + unlockedTokens
  YT[staker] = 0
  PT[protocol][staker] = 0

  ao.send({
    Target = staker,
    Tags = {
      Action = 'Maturity-Unlock',
      TokensUnlocked = tostring(unlockedTokens),
      Protocol = protocol
    }
  })
end)
