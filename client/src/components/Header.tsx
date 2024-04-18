import { NavLink } from "react-router-dom";

interface HeaderProps {
  showAdminControls: boolean;
}
const Header: React.FC<HeaderProps> = ({ showAdminControls }) => {
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
        <img src="jukebox_bg.png" alt="Jukebox" className="w-full object-cover" />
        <h1 className="h3 !font-semibold !mb-6">Jukebox</h1>
      </div>
    </div>
  );
};

export default Header;
