/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup"
import { useForm } from "react-hook-form";
import ProtocolContainer from "@/pages/app/protocols/components/ProtocolsContainer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader } from "lucide-react";
import { Plus } from "lucide-react";
import { PROCESS_ID } from "@/helpers/constants";
import {
    result,
    message,
    createDataItemSigner,
    dryrun,
} from "@permaweb/aoconnect";
import { useActiveAddress } from "@arweave-wallet-kit-beta/react";
import toast from "react-hot-toast";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

declare global {
    interface Window {
        arweaveWallet: any;
    }
}

const schema = yup.object({
    protocolName: yup.string().required("Protocol name is required"),
    protocolLogo: yup.string().required("Protocol logo is required"),
    yieldRate: yup.number().required("Yield rate is required"),
    maturityDate: yup.string()
        .required("Maturity date is required")
        .test("futureDate", "Maturity date must be in the future", (value) => {
            if (!value) return false;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const selectedDate = new Date(value);
            return selectedDate >= today;
        }),
});

const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
}

const isExpired = (maturityDate: number) => {
    const currentDate = new Date().getTime();
    return currentDate > maturityDate;
};

export default function Protocols() {
    const [balance, setBalance] = useState(0);
    const [protocolList, setProtocolList] = useState<any[]>([]);
    const [isAddingProtocol, setIsAddingProtocol] = useState(false);
    const [formData, setFormData] = useState<null | yup.InferType<typeof schema>>(null);
    const { register, handleSubmit, formState: { errors } } = useForm<yup.InferType<typeof schema>>({
        resolver: yupResolver(schema),
        mode: "onTouched",
    });
    const activeAddress = useActiveAddress();
    const [isLoading, setIsLoading] = useState(false);
    const [showAddProtocolModal, setShowAddProtocolModal] = useState(false);

    const [showStakeModal, setShowStakeModal] = useState(false);
    const [selectedProtocol, setSelectedProtocol] = useState<any>(null);
    const [stakeAmount, setStakeAmount] = useState("");

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
            handleBalance();
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

    async function handleProtocols() {
        setIsLoading(true);
        try {
            const res = await dryrun({
                process: PROCESS_ID,
                data: "",
                tags: [
                    { name: "Action", value: "GetProtocols" },
                ],
            });

            const protocols = res.Messages[0]?.Tags.find(
                (tag: any) => tag.name === "Protocols"
            )?.value;

            if (protocols) {
                const parsedProtocols = JSON.parse(protocols);
                // console.log("Parsed Protocols", parsedProtocols);
                setProtocolList(parsedProtocols);
            } else {
                console.error("No protocols found in response");
            }
        } catch (error) {
            console.error("Error fetching protocols:", error);
            toast.error("Failed to load protocols");
            setProtocolList([]);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleAddProtocol(data: yup.InferType<typeof schema>) {
        setIsAddingProtocol(true);
        try {
            setFormData(data);
            if (formData) {
                const maturityDateInMillis = new Date(formData.maturityDate).getTime();

                const updatedFormData = {
                    ...formData,
                    maturityDate: maturityDateInMillis,
                }

                console.log("Updated Form Data", updatedFormData);
                if (activeAddress != "wT2aEN3NxaN3DFRJucM51kEDVScudmURt1GsfIYpBIA") {
                    toast.error("Only the platform moderator can add new protocols");
                    return;
                }

                const response = await message({
                    process: PROCESS_ID,
                    tags: [
                        { name: "Action", value: "AddProtocol" },
                        { name: "Sender", value: activeAddress || "" },
                        { name: "ProtocolName", value: updatedFormData?.protocolName || "" },
                        { name: "ProtocolLogo", value: updatedFormData?.protocolLogo || "" },
                        { name: "YieldRate", value: updatedFormData?.yieldRate.toString() || "" },
                        { name: "MaturityDate", value: updatedFormData?.maturityDate.toString() || "" },
                    ],
                    signer: createDataItemSigner(window.arweaveWallet),
                })

                const registerResponse = await result({
                    process: PROCESS_ID,
                    message: response,
                })
                console.log("Register Response", registerResponse);

                if (registerResponse.Messages[0].Tags[5].value === "ProtocolAdded") {
                    toast.success("Protocol added successfully");
                    setShowAddProtocolModal(false);
                    handleProtocols();
                }
            }

        } catch (error) {
            console.error("Error adding protocol:", error);
            toast.error("Failed to add protocol");
        } finally {
            setIsAddingProtocol(false);
        }
    }

    async function handleStake(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        try {

            if (selectedProtocol && isExpired(Number(selectedProtocol.maturityDate))) {
                toast.error("Cannot stake in an expired protocol");
                setShowStakeModal(false);
                return;
            }

            const response = await message({
                process: PROCESS_ID,
                tags: [
                    { name: "Action", value: "Stake" },
                    { name: "ProtocolId", value: selectedProtocol.id.toString() },
                    { name: "Quantity", value: stakeAmount },
                ],
                signer: createDataItemSigner(window.arweaveWallet),
            })

            const stakeResult = await result({
                process: PROCESS_ID,
                message: response,
            })

            console.log("Stake Result", stakeResult);
            if (stakeResult.Messages[0].Tags[5].value === "Stake-Success") {
                toast.success("Staked successfully");
                setShowStakeModal(false);
                setStakeAmount("");
                handleProtocols();
                handleBalance();
            }
        } catch (error) {
            console.error("Error staking:", error);
            toast.error("Failed to stake tokens");
        }
    }

    useEffect(() => {
        handleBalance();
        handleProtocols();
    }, []);

    return (
        <div className="flex h-full py-10 relative flex-1 flex-col text-white justify-start">
            <ProtocolContainer className="flex flex-col flex-1 gap-3">
                <div className="text-white flex justify-between items-center py-4 border-b border-violet-700/30">
                    <p className="text-lg font-semibold">Mint YLD tokens to test the protocols. (For now aoYield only supports YLD)</p>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center backdrop-blur-sm rounded-lg">
                            <span className="text-gray-200 mr-2">Balance:</span>
                            {isLoading ? (
                                <Loader className="animate-spin" />
                            ) : (
                                <span className="font-semibold">{balance} YLD</span>
                            )}
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
                                    <TableHead>Yield Rate</TableHead>
                                    <TableHead>TVL</TableHead>
                                    <TableHead>Liquidity</TableHead>
                                    <TableHead>Users</TableHead>
                                    <TableHead>Maturity</TableHead>
                                    <TableHead>Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-32">
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Loader className="animate-spin w-6 h-6" />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : Array.isArray(protocolList) && protocolList.length > 0 ? (
                                    protocolList.map((protocol: any) => (
                                        <TableRow key={protocol?.id || 'unknown'}>
                                            <TableCell><img src={protocol?.logo} alt="" /> {protocol?.name}</TableCell>
                                            <TableCell>{protocol?.yieldRate} %</TableCell>
                                            <TableCell>$ {protocol?.tvl}</TableCell>
                                            <TableCell>$ {protocol?.liquidity}</TableCell>
                                            <TableCell>{protocol?.usersCount}</TableCell>
                                            <TableCell>
                                                {protocol?.maturityDate ? new Date(Number(protocol.maturityDate)).toLocaleDateString() : 'N/A'}
                                            </TableCell>
                                            <TableCell>
                                                {isExpired(Number(protocol.maturityDate)) ? (
                                                    <span className="text-red-500 font-medium">Expired</span>
                                                ) : (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedProtocol(protocol);
                                                            setShowStakeModal(true);
                                                        }}
                                                        className="text-violet-500 hover:text-violet-400 font-medium transition-colors duration-200"
                                                    >
                                                        Stake
                                                    </button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-32 text-center">
                                            No protocols available
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                <Button
                    onClick={() => setShowAddProtocolModal(true)}
                    variant="default"
                    className="bg-violet-600 hover:bg-violet-700"
                >
                    <Plus className="w-4 h-4 mr-2" /> {/* Import Plus from lucide-react */}
                    Add Protocol
                </Button>
            </ProtocolContainer>
            <Dialog open={showStakeModal} onOpenChange={setShowStakeModal}>
                <DialogContent className="border border-violet-700/30">
                    <DialogHeader>
                        <DialogTitle>Stake Tokens</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleStake} className="space-y-4">
                        {selectedProtocol && (
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Protocol:</span>
                                    <span>{selectedProtocol.name}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Yield Rate:</span>
                                    <span>{selectedProtocol.yieldRate}%</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Maturity Date:</span>
                                    <span>{new Date(Number(selectedProtocol.maturityDate)).toLocaleDateString()}</span>
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="stakeAmount">Amount to Stake</Label>
                            <Input
                                id="stakeAmount"
                                type="number"
                                step="10"
                                value={stakeAmount}
                                onChange={(e) => setStakeAmount(e.target.value)}
                                className="bg-transparent border-violet-700/30"
                                placeholder="Enter amount"
                                required
                            />
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowStakeModal(false)}
                                className="border-violet-700/30 hover:bg-violet-700/30"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="bg-violet-600 hover:bg-violet-700"
                            >
                                Stake Tokens
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            <Dialog open={showAddProtocolModal} onOpenChange={setShowAddProtocolModal}>
                <DialogContent className="border border-violet-700/30">
                    <DialogHeader>
                        <DialogTitle className="">Add New Protocol</DialogTitle>
                        <DialogDescription className="text-gray-400">
                            Only the platform moderator can add new protocols.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit(handleAddProtocol)} className="space-y-4">
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="protocolName">Protocol Name</Label>
                                <Input
                                    id="protocolName"
                                    {...register("protocolName")}
                                    className=" border-violet-700/30 "
                                />
                                {errors.protocolName && (
                                    <span className="text-red-500 text-sm">{errors.protocolName.message}</span>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="protocolLogo" className="">Logo URL</Label>
                                <Input
                                    id="protocolLogo"
                                    {...register("protocolLogo")}
                                    className="bg-transparent border-violet-700/30 "
                                />
                                {errors.protocolLogo && (
                                    <span className="text-red-500 text-sm">{errors.protocolLogo.message}</span>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="yieldRate" className="">Yield Rate (%)</Label>
                                <Input
                                    id="yieldRate"
                                    type="number"
                                    step="0.01"
                                    {...register("yieldRate")}
                                    className="bg-transparent border-violet-700/30 "
                                />
                                {errors.yieldRate && (
                                    <span className="text-red-500 text-sm">{errors.yieldRate.message}</span>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="maturityDate" className="">Maturity Date</Label>
                                <Input
                                    id="maturityDate"
                                    type="date"
                                    {...register("maturityDate")}
                                    className="bg-transparent border-violet-700/30 "
                                    min={getTodayDate()}
                                />
                                {errors.maturityDate && (
                                    <span className="text-red-500 text-sm">{errors.maturityDate.message}</span>
                                )}
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowAddProtocolModal(false)}
                                className="border-violet-700/30  hover:bg-violet-700/30"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="bg-violet-600 hover:bg-violet-700"
                                disabled={isAddingProtocol}
                            >
                                {isAddingProtocol ? (
                                    <>
                                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                                        Adding...
                                    </>
                                ) : (
                                    'Add Protocol'
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}