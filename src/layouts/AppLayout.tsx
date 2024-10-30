import Navbar from "@/components/Navbar";

type Props = {
    children: React.ReactNode
}

const AppLayout = ({ children }: Props) => {
    return (
        <div className="flex w-full flex-col min-h-screen bg-gradient-to-b from-violet-950 via-violet-600 to-current">
            <Navbar />
            {children}
        </div>
    )
}

export default AppLayout;