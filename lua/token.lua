-- This is the token contract and it's tokens are used for aoyield. (for now)

local json = require('json')

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
    local quantity = 1000;

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
