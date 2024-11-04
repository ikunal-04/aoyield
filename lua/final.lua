local json = require("json")

ProtocolsId = tostring(0)
User = {}

-- This is the token contract and it's tokens are used for aoyield. (for now)\
-- processId: "pt0dfFDOc4eJDSdhDNsSmzjdJLq_qw5gs1uCioueGn4"

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
    assert(msg.From == ao.id, "Only owner can add protocols")

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
        maturityDate = msg.Tags.MaturityDate,
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

