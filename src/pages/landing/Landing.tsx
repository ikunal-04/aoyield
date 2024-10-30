import useAuth from "@/hooks/useAuth";
import { FaArrowRightLong } from "react-icons/fa6";
import SVG from "react-inlinesvg";
import { useNavigate } from "react-router-dom";

export default function Landing() {
    const { connected, handleConnectBtnClick } = useAuth();
    const navigate = useNavigate();
    function handleExploreClick() {
        if (connected) {
            navigate("/app/protocols");
        } else {
            handleConnectBtnClick();
        }
    }
    return (
        <div className="flex h-full relative flex-1 flex-col bg-gradient-to-b from-violet-950 via-violet-600 to-current text-white justify-center">
            {/* <div className="absolute flex w-full h-full justify-center items-center z-10">
        <SVG src="/bg.svg" className="h-full" />
      </div> */}
            <div className="flex h-full flex-col justify-center items-center gap-20 z-50">
                <div className="flex flex-col gap-12">
                    <h1 className="text-white font-bold text-6xl text-center">
                        Effortless Yield Generation,
                        <br /> <div className="flex gap-2 items-center justify-center">
                            Powered by <SVG className="w-20 h-20" src="/ao.svg" />
                        </div>
                    </h1>
                    <p className="text-center text-2xl">
                    Experience seamless staking and yield earning through our decentralized platform, 
                    <br />harnessing the power of Arweave’s permanent storage for complete transparency and reliability.
                        
                    </p>
                </div>
                <div>
                    <button
                        onClick={handleExploreClick}
                        className="text-black border border-black rounded-[64px] px-10 py-3 text-base flex items-center gap-2"
                    >
                        Start Earning
                        <FaArrowRightLong />
                    </button>
                </div>
            </div>
        </div>
    );
}