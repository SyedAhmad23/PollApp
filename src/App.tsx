import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";
import Home from "./pages/Home";
import PollView from "./pages/PoolView";
import CreatePoll from "./pages/CreatePoll";
import type { User } from "./utilities/types";
import Header from "./components/Header";
import MyPolls from "./pages/MyPolls";
import EditPoll from "./pages/EditPoll";

function mapSupabaseUser(supabaseUser: unknown): User | undefined {
  if (
    !supabaseUser ||
    typeof supabaseUser !== "object" ||
    !("id" in supabaseUser) ||
    !("email" in supabaseUser)
  )
    return undefined;
  const userObj = supabaseUser as { id: string; email?: string };
  return {
    id: userObj.id,
    email: userObj.email || "",
    created_polls_count: undefined,
  };
}

function App() {
  const [user, setUser] = useState<User | undefined>(undefined);

  useEffect(() => {
    supabase.auth
      .getUser()
      .then(({ data }) => setUser(mapSupabaseUser(data?.user)));
    supabase.auth.onAuthStateChange((_event, session) =>
      setUser(mapSupabaseUser(session?.user))
    );
  }, []);

  return (
    <BrowserRouter>
      <Header user={user} />
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Home user={user} />} />
        <Route
          path="/login"
          element={!user ? <Login /> : <Navigate to="/" />}
        />
        <Route
          path="/register"
          element={!user ? <Register /> : <Navigate to="/" />}
        />
        <Route path="/poll/:id" element={<PollView user={user} />} />
        <Route
          path="/my-polls"
          element={user ? <MyPolls user={user} /> : <Navigate to="/login" />}
        />
        <Route
          path="/create"
          element={user ? <CreatePoll user={user} /> : <Navigate to="/login" />}
        />
        <Route
          path="/edit/:id"
          element={user ? <EditPoll user={user} /> : <Navigate to="/login" />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
