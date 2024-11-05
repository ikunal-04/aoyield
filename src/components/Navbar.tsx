import { Link, useLocation } from "react-router-dom";

import ConnectBtn from "@/components/ConnectBtn";
import clsx from "clsx";

export default function Navbar() {
  const { pathname } = useLocation();

  return (
    <div
      className={clsx(
        "px-[70px] py-[30px] bg-violet-950 flex items-center justify-between w-full",
        {
          "border-b-[1px] border-b-[#414573]": pathname !== "/",
        }
      )}
    >
      <div className="flex items-center">
        <Link to={"/"} className="text-3xl font-bold text-white">
          aoYield
        </Link>
      </div>
      <div className="flex items-center gap-4">
        <Link to="/" className="text-lg text-white font-medium">
          Home
        </Link>
        <Link to="/app/protocols" className="text-lg text-white font-medium">
          Protocols
        </Link>
        <Link to="/app/portfolio" className=" text-lg text-white font-medium">
          Portfolio
        </Link>
        <Link to="/docs" className="text-lg text-white font-medium">
          Docs
        </Link>
      </div>
      <div>
        <ConnectBtn />
      </div>
    </div>
  );
}