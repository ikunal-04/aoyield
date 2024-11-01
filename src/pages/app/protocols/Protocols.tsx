import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import ProtocolContainer from "@/pages/app/protocols/components/ProtocolsContainer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

import { PROCESS_ID } from "@/helpers/constants";
import {
    result,
    message,
    createDataItemSigner,
    dryrun,
} from "@permaweb/aoconnect";
import { useActiveAddress } from "@arweave-wallet-kit-beta/react";
import toast from "react-hot-toast";

declare global {
    interface Window {
        arweaveWallet: any;
    }
}

const protocols = [
    { id: 1, name: 'Aave', rate: '3.5%', maturity: '30 days' },
    { id: 2, name: 'Compound', rate: '4.2%', maturity: '60 days' },
    { id: 3, name: 'Curve', rate: '5.1%', maturity: '90 days' },
]

export default function Protocols() {
    const [balance, setBalance] = useState(0);
    const [isStaking, setIsStaking] = useState(false);
    const [isMinting, setIsMinting] = useState(false);
    const navigate = useNavigate();
    const activeAddress = useActiveAddress();

    async function handleMint() {
        //submit the process via aoconnect
        const response = await message({
            process: PROCESS_ID,
            tags: [{ name: "Action", value: "User-Mint" }],
            signer: createDataItemSigner(window.arweaveWallet),
        })

        const mintResult = await result({
            process: PROCESS_ID,
            message: response,
        });

        console.log("Mint Result", mintResult);
        if (mintResult.Messages[0].Tags[4].value === "Mint-Success") {
            toast.success("YLD Minted Successfully");
        }
    }

    async function handleBalance() {
        const res = await dryrun({
            process: PROCESS_ID,
            data: "",
            tags: [
                { name: "Action", value: "Balance" },
                { name: "Target", value: activeAddress || "" },
            ],
        });
        const [balance] = res.Messages.map((msg: any) => {
            const parsedStream = msg.Tags.find((tag: any) => tag.name === "Balance");
            return parsedStream ? JSON.parse(parsedStream.value) : {};
        });

        setBalance(balance);
    }

    useEffect(() => {
        handleBalance();
    });

    return (
        <div className="flex h-full py-10 relative flex-1 flex-col bg-aovest-bg text-white justify-start">
            <ProtocolContainer className="flex flex-col flex-1 gap-3">
                <div className="text-white flex justify-between items-center py-4 border-b border-violet-700/30">
                    <p className="text-lg font-semibold">Mint YLD tokens to test the protocols. (For now aoYield only supports YLD)</p>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center bg-violet-800/50 backdrop-blur-sm rounded-lg">
                            <span className="text-gray-200 mr-2">Balance:</span>
                            <span className="font-semibold">{balance} YLD</span>
                        </div>
                        <Button
                            onClick={handleMint}
                            variant="secondary"
                            className="h-auto"
                        >
                            Mint
                        </Button>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Available Protocols</CardTitle>
                        <CardDescription>Choose a protocol to stake your tokens</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Protocol</TableHead>
                                    <TableHead>Rate</TableHead>
                                    <TableHead>Maturity</TableHead>
                                    <TableHead>Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {protocols.map((protocol) => (
                                    <TableRow key={protocol.id}>
                                        <TableCell>{protocol.name}</TableCell>
                                        <TableCell>{protocol.rate}</TableCell>
                                        <TableCell>{protocol.maturity}</TableCell>
                                        <TableCell>
                                            <Link to={`/stake/${protocol.id}`} className="text-primary hover:underline">
                                                Stake
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </ProtocolContainer>
        </div>
    )
}