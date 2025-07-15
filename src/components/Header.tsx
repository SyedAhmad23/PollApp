import { Link, useNavigate } from "react-router-dom";
import type { User } from "../utilities/types";
import { supabase } from "../lib/supabaseClient";
import { BiBarChart, BiLogOut } from "react-icons/bi";
import { FaUser } from "react-icons/fa";

const Header = ({ user }: { user?: User }) => {
  const navigate = useNavigate();
  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
    window.location.reload();
  };
  return (
    <header className="bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm">
      <Link to="/" className="flex items-center space-x-2">
        <BiBarChart className="h-8 w-8 text-blue-600" />
        <span className="text-xl font-bold text-gray-900">PollApp</span>
      </Link>
      <nav>
        {user ? (
          <div className="flex items-center gap-4">
            <Link
              to="/my-polls"
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition"
            >
              My Polls
            </Link>
            <div className="flex items-center space-x-2">
              <FaUser className="h-4 w-4 text-gray-600" />
              <span className="text-sm text-gray-600">{user.email}</span>
            </div>
            <button
              onClick={signOut}
              className="px-4 py-2 bg-red-500 text-white rounded-xl cursor-pointer hover:bg-red-600 transition"
            >
              <BiLogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="space-x-4">
            <Link
              to="/login"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
            >
              Register
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
