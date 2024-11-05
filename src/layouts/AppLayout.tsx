import Navbar from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useLocation } from "react-router-dom";

type Props = {
    children: React.ReactNode
}

const AppLayout = ({ children }: Props) => {
    const location = useLocation();
    const isLandingPage = location.pathname === "/";

    return (
        <div className="flex w-full flex-col min-h-screen bg-gradient-to-b from-violet-950 via-violet-600 to-current">
            <Navbar />
            {children}
            {!isLandingPage && <Footer />}
        </div>
    )
}

export default AppLayout;