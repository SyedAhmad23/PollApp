import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import type { Poll, User } from "../utilities/types";
import PollCard from "../components/PollCard";
import toast from "react-hot-toast";

const MyPolls = ({ user }: { user?: User }) => {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchMyPolls = async () => {
      const { data, error } = await supabase
        .from("polls")
        .select("*")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false });
      if (error) toast.error("Failed to load your polls");
      else setPolls(data || []);
      setLoading(false);
    };
    fetchMyPolls();
  }, [user]);
  console.log(polls, "polls");

  if (!user) return <div>Please log in to view your polls.</div>;
  if (loading) return <div>Loading...</div>;

  return (
    <div className="container mx-auto py-8">
      <h2 className="text-2xl font-bold mb-6">My Polls</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {polls.map((poll) => (
          <PollCard
            key={poll.id}
            poll={poll}
            showActions
            user={user}
            onDelete={() => setPolls(polls.filter((p) => p.id !== poll.id))}
          />
        ))}
      </div>
    </div>
  );
};

export default MyPolls;
