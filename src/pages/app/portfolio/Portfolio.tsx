import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Portfolio() {
    const [stakedTokens, setStakedTokens] = useState(0)
    const [accumulatedYield, setAccumulatedYield] = useState(0)

    useEffect(() => {
        // In a real app, you would fetch this data from your backend or blockchain
        setStakedTokens(1000)
        setAccumulatedYield(50)
    }, [])

    return (
        <div className="flex h-full py-10 relative flex-1 flex-col bg-aovest-bg text-white justify-start">
            <Card className="w-full h-full max-w-[876px] mx-auto my-0 flex flex-col gap-3" >
                <CardHeader>
                    <CardTitle>Your Yield Dashboard</CardTitle>
                    <CardDescription>Track your staked tokens and earned yield</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Protocols</p>
                            <p className="text-2xl font-bold">1</p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Staked Tokens</p>
                            <p className="text-2xl font-bold">{stakedTokens.toFixed(2)}</p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Accumulated Yield</p>
                            <p className="text-2xl font-bold">{accumulatedYield.toFixed(2)}</p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Maturity Status</p>
                            <p className="text-2xl font-bold">{stakedTokens > 0 ? 'In Progress' : 'N/A'}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
