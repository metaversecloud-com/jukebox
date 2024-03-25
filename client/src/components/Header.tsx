import { Link } from "react-router-dom";

interface HeaderProps {
  showAdminControls: boolean;
}
const Header: React.FC<HeaderProps> = ({ showAdminControls }) => {
  return (
    <div className="flex w-full flex-col items-center justify-center">
      {showAdminControls && (
        <Link
          to={"/admin"}
          className="border rounded-full flex self-start items-center justify-center p-1 hover:bg-slate-100"
        >
          <i className="icon settings-icon h-6 w-6" />
        </Link>
      )}

      <div className="flex flex-col items-center justify-center mt-2">
        <img src="Gramophone_Front.png" alt="Gramophone" className="w-96 h-52 object-cover" />
        <h1 className="h3 font-semibold my-6">Jukebox</h1>
      </div>
    </div>
  );
};

export default Header;
