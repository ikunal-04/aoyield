import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const protocols = [
    { id: 1, name: 'Aave', rate: '3.5%', maturity: '30 days' },
    { id: 2, name: 'Compound', rate: '4.2%', maturity: '60 days' },
    { id: 3, name: 'Curve', rate: '5.1%', maturity: '90 days' },
]

export default function Protocols() {
    return (
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
    )
}