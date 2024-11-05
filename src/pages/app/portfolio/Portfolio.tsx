/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PROCESS_ID } from "@/helpers/constants"
import { message, result } from "@permaweb/aoconnect"
import { createDataItemSigner } from "@permaweb/aoconnect"
import { toast } from "react-hot-toast"
import { Loader } from "lucide-react";

export default function Portfolio() {
    const [userStakes, setUserStakes] = useState<any[]>([]);
    const [totalYield, setTotalYield] = useState(0);
    const [totalStaked, setTotalStaked] = useState(0);
    const [apyRange, setApyRange] = useState("N/A");
    const [isLoading, setIsLoading] = useState(false);
    async function fetchUserInfo() {
        setIsLoading(true);
        try {
            const response = await message({
                process: PROCESS_ID,
                tags: [
                    { name: "Action", value: "GetUserInfo" }
                ],
                signer: createDataItemSigner(window.arweaveWallet),
            });

            const userInfo = await result({
                process: PROCESS_ID,
                message: response,
            });

            console.log(userInfo);

            if (userInfo.Messages[0].Tags.find((tag: any) => tag.name === "Action")?.value === "UserStakes") {
                const tags = userInfo.Messages[0].Tags;
                const stakesData = JSON.parse(tags.find((tag: any) => tag.name === "Stakes")?.value || "[]");
                // const activeProtocols = tags.find((tag: any) => tag.name === "ActiveProtocols")?.value || "0";
                const totalStaked = tags.find((tag: any) => tag.name === "TotalStaked")?.value || "0";
                const totalYield = tags.find((tag: any) => tag.name === "TotalYield")?.value || "0";
                const minAPY = tags.find((tag: any) => tag.name === "MinAPY")?.value || "0";
                const maxAPY = tags.find((tag: any) => tag.name === "MaxAPY")?.value || "0";

                setUserStakes(stakesData);
                setTotalStaked(Number(totalStaked));
                setTotalYield(Number(totalYield));

                // Format APY range
                const apyRange = Number(minAPY) === 0 && Number(maxAPY) === 0
                    ? "N/A"
                    : `${Number(minAPY)}% - ${Number(maxAPY)}%`;
                setApyRange(apyRange);
            }
        } catch (error) {
            console.error("Error fetching user info:", error);
            toast.error("Failed to fetch staking information");
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        fetchUserInfo();
    }, []);

    return (
        <div className="flex h-full py-10 relative flex-1 flex-col text-white justify-start">
            <Card className="w-full h-full max-w-[876px] mx-auto my-0 flex flex-col gap-3">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Your Yield Dashboard</CardTitle>
                        <CardDescription>Track your staked tokens and earned yield</CardDescription>
                    </div>
                    <Button
                        onClick={fetchUserInfo}
                        variant="outline"
                        className="border-violet-700/30 hover:bg-violet-700/30"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <Loader className="h-4 w-4 animate-spin" />
                        ) : (
                            'Refresh Data'
                        )}
                    </Button>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center items-center h-full">
                            <Loader className="h-4 w-4 animate-spin" />
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <p className="text-sm font-medium">Active Protocols</p>
                                    <p className="text-2xl font-bold">{userStakes.length}</p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-sm font-medium">Total Staked</p>
                                    <p className="text-2xl font-bold">{totalStaked.toFixed(2)}</p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-sm font-medium">Total Yield</p>
                                    <p className="text-2xl font-bold">{totalYield.toFixed(2)}</p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-sm font-medium">APY Range</p>
                                    <p className="text-2xl font-bold">
                                        {apyRange}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-8">
                                <h3 className="text-lg font-semibold mb-4">Your Active Stakes</h3>
                                <div className="grid grid-cols-1 gap-4">
                                    {userStakes.map((stake, index) => (
                                        <Card key={index} className="border border-violet-700/30">
                                            <CardContent className="pt-6">
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    <div>
                                                        <p className="text-sm text-gray-400">Protocol</p>
                                                        <p className="font-medium">{stake.protocolName}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-400">Staked Amount</p>
                                                        <p className="font-medium">{stake.amount.toFixed(2)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-400">Current Yield</p>
                                                        <p className="font-medium">{(stake.currentYield || 0).toFixed(2)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-400">Maturity Date</p>
                                                        <p className="font-medium">
                                                            {new Date(stake.maturityDate).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}

                                    {userStakes.length === 0 && (
                                        <div className="text-center py-8 text-gray-400">
                                            No active stakes found. Start staking to earn yield!
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}