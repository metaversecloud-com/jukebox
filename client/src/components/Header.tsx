import { useContext } from "react";
import { NavLink } from "react-router-dom";
import { GlobalStateContext } from "@/context/GlobalContext";
import { InitialState } from "@/context/types";

interface HeaderProps {
  showAdminControls: boolean;
}

const DEFAULT_IMAGE_BY_MODE: Record<string, string> = {
  jukebox: "jukebox_bg.png",
  karaoke: "jukebox_bg.png",
};

const DEFAULT_NAME_BY_MODE: Record<string, string> = {
  jukebox: "Jukebox",
  karaoke: "Karaoke",
};

const Header: React.FC<HeaderProps> = ({ showAdminControls }) => {
  const { settings } = useContext(GlobalStateContext) as InitialState;
  const mode = settings?.mode ?? "karaoke";
  const displayName = settings?.name?.trim() || DEFAULT_NAME_BY_MODE[mode];
  const displayImage = settings?.imageUrl?.trim() || DEFAULT_IMAGE_BY_MODE[mode];

  return (
    <div className="flex w-full flex-col items-center justify-center">
      {showAdminControls && (
        <div className="flex w-full items-center justify-center border rounded-lg py-1">
          <NavLink
            end
            to={"/"}
            className={({ isActive }) => {
              return `p-2 transition-colors rounded-lg mx-1 w-1/2 flex items-center justify-center ${isActive ? "bg-[#0a2540] hover:bg-[#3b5166] text-white" : "bg-white text-[#0a2540]"}`;
            }}
          >
            Home
          </NavLink>
          <NavLink
            end
            to={"/admin"}
            className={({ isActive }) => {
              return `p-2 transition-colors rounded-lg mx-1 w-1/2 flex items-center justify-center ${isActive ? "bg-[#0a2540] hover:bg-[#3b5166] text-white" : "bg-white text-[#0a2540]"}`;
            }}
          >
            Admin
          </NavLink>
        </div>
      )}

      <div className="flex flex-col items-center justify-center mt-2">
        <img src={displayImage} alt={displayName} className="w-full object-cover" />
        <h1 className="h3 !font-semibold !mb-6">{displayName}</h1>
      </div>
    </div>
  );
};

export default Header;
