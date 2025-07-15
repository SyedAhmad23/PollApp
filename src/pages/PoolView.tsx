import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { supabase } from "../lib/supabaseClient";
import type { Poll, User } from "../utilities/types";
import {
  FaShareAlt,
  FaUserFriends,
  FaClock,
  FaArrowLeft,
} from "react-icons/fa";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Generate random IP hash
const generateIPHash = () => {
  return (
    "anon_" + Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
  );
};

interface Vote {
  id: string;
  poll_id: string;
  user_id?: string | null;
  ip_hash?: string | null;
  selected_options: string[];
  created_at: string;
}

const PoolView = ({ user }: { user?: User }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPoll();
      checkIfVoted();
      // Real-time subscription
      const subscription = supabase
        .channel(`poll-${id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "votes",
            filter: `poll_id=eq.${id}`,
          },
          () => fetchVotes()
        )
        .subscribe();
      return () => {
        subscription.unsubscribe();
      };
    }
  }, [id, user]);

  const fetchPoll = async () => {
    try {
      const { data, error } = await supabase
        .from("polls")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        toast.error("Poll not found");
        navigate("/");
        return;
      }
      const transformedPoll: Poll = {
        id: data.id,
        question: data.question,
        options: Array.isArray(data.options) ? (data.options as string[]) : [],
        created_at: data.created_at,
        ends_at: data.ends_at || undefined,
        created_by: data.created_by || undefined,
        settings:
          typeof data.settings === "object" &&
          data.settings !== null &&
          !Array.isArray(data.settings)
            ? (data.settings as {
                allowMultiple?: boolean;
                showResults?: boolean;
              })
            : { allowMultiple: false, showResults: true },
      };
      setPoll(transformedPoll);
      fetchVotes();
    } catch (error) {
      toast.error("Failed to load poll");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const fetchVotes = async () => {
    try {
      const { data, error } = await supabase
        .from("votes")
        .select("*")
        .eq("poll_id", id);
      if (error) throw error;
      const transformedVotes: Vote[] =
        data?.map((vote: any) => ({
          id: vote.id,
          poll_id: vote.poll_id,
          user_id: vote.user_id || undefined,
          ip_hash: vote.ip_hash || undefined,
          selected_options: Array.isArray(vote.selected_options)
            ? (vote.selected_options as string[])
            : [],
          created_at: vote.created_at,
        })) || [];
      setVotes(transformedVotes);
    } catch (error) {
      // silent
    }
  };

  const checkIfVoted = () => {
    if (!id) return;
    const votedPolls = JSON.parse(localStorage.getItem("votedPolls") || "[]");
    if (votedPolls.includes(id)) {
      setHasVoted(true);
    }
  };

  const handleOptionChange = (option: string) => {
    if (!poll) return;
    if (poll.settings.allowMultiple) {
      setSelectedOptions((prev) =>
        prev.includes(option)
          ? prev.filter((o) => o !== option)
          : [...prev, option]
      );
    } else {
      setSelectedOptions([option]);
    }
  };

  const handleVote = async () => {
    if (!poll || selectedOptions.length === 0) {
      toast.error("Please select at least one option");
      return;
    }
    setVoting(true);
    try {
      let voterId = user?.id;
      let ipHash = null;
      if (!user) {
        ipHash = localStorage.getItem("anonymousUserId") || generateIPHash();
        localStorage.setItem("anonymousUserId", ipHash);
      }
      const { error } = await supabase.from("votes").insert([
        {
          poll_id: poll.id,
          user_id: voterId || null,
          ip_hash: ipHash,
          selected_options: selectedOptions,
        },
      ]);
      if (error) throw error;
      if (!user) {
        const votedPolls = JSON.parse(
          localStorage.getItem("votedPolls") || "[]"
        );
        votedPolls.push(poll.id);
        localStorage.setItem("votedPolls", JSON.stringify(votedPolls));
      }
      setHasVoted(true);
      toast.success("Vote submitted successfully!");
      fetchVotes();
    } catch (error: any) {
      toast.error(error.message || "Failed to submit vote");
    } finally {
      setVoting(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Poll link copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const getVoteData = () => {
    if (!poll) return [];
    return poll.options.map((option) => ({
      option,
      votes: votes.filter((vote) => vote.selected_options.includes(option))
        .length,
      percentage:
        votes.length > 0
          ? Math.round(
              (votes.filter((vote) => vote.selected_options.includes(option))
                .length /
                votes.length) *
                100
            )
          : 0,
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Poll not found
          </h2>
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 px-4 py-2 rounded bg-blue-600 text-white"
          >
            <FaArrowLeft className="mr-2 h-4 w-4" />
            Back to Polls
          </button>
        </div>
      </div>
    );
  }

  const voteData = getVoteData();
  const totalVotes = votes.length;
  const isExpired = poll.ends_at && new Date(poll.ends_at) < new Date();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate("/")}
            className="mb-6 flex items-center gap-2 px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-700"
          >
            <FaArrowLeft className="mr-2 h-4 w-4" />
            Back to Polls
          </button>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Poll Content */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="bg-white  rounded-xl shadow-md p-8 border border-gray-200 ">
                  <div className="flex justify-between items-start mb-4">
                    <h1 className="text-2xl font-bold">{poll.question}</h1>
                    <button
                      onClick={handleShare}
                      className="flex items-center gap-2 px-3 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-100"
                    >
                      <FaShareAlt className="h-4 w-4" /> Share
                    </button>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-6">
                    <div className="flex items-center gap-1">
                      <FaUserFriends className="h-4 w-4" />
                      {totalVotes} votes
                    </div>
                    {poll.ends_at && (
                      <div className="flex items-center gap-1">
                        <FaClock className="h-4 w-4" />
                        {isExpired ? "Ended" : "Ends"}{" "}
                        {new Date(poll.ends_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  {!hasVoted && !isExpired ? (
                    <div className="space-y-4">
                      <div className="space-y-3">
                        {poll.options.map((option, index) => (
                          <div
                            key={index}
                            className="flex items-center space-x-3"
                          >
                            <input
                              type={
                                poll.settings.allowMultiple
                                  ? "checkbox"
                                  : "radio"
                              }
                              id={`option-${index}`}
                              checked={selectedOptions.includes(option)}
                              onChange={() => handleOptionChange(option)}
                              className="accent-blue-600 h-5 w-5"
                            />
                            <label
                              htmlFor={`option-${index}`}
                              className="text-sm font-medium leading-none cursor-pointer flex-1"
                            >
                              {option}
                            </label>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={handleVote}
                        disabled={voting || selectedOptions.length === 0}
                        className="w-full bg-gradient-to-r cursor-pointer bg-gray-800 hover:bg-gray-900 text-white py-1.5 rounded-lg font-semibold text-lg transition disabled:opacity-60"
                      >
                        {voting ? "Submitting..." : "Submit Vote"}
                      </button>
                      {!poll.settings.allowMultiple && (
                        <p className="text-xs text-gray-500">
                          You can select only one option
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-green-600 mb-2">
                        {isExpired ? "🔒 Poll has ended" : "✅ Vote submitted!"}
                      </div>
                      <p className="text-gray-600">
                        {isExpired
                          ? "This poll is no longer accepting votes"
                          : "Thank you for participating in this poll"}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
            {/* Results */}
            {poll.settings?.showResults && (
              <div className="lg:col-span-1">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <div className="bg-white  rounded-xl shadow-md p-6 border border-gray-200 ">
                    <h2 className="text-lg font-semibold mb-4">Results</h2>
                    {totalVotes > 0 ? (
                      <div className="space-y-4">
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={voteData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              dataKey="option"
                              angle={-45}
                              textAnchor="end"
                              height={100}
                              fontSize={12}
                            />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="votes" fill="#3B82F6" />
                          </BarChart>
                        </ResponsiveContainer>
                        <div className="space-y-2">
                          {voteData.map((data, index) => (
                            <div
                              key={index}
                              className="flex justify-between items-center text-sm"
                            >
                              <span className="truncate flex-1 mr-2">
                                {data.option}
                              </span>
                              <span className="font-medium">
                                {data.votes} ({data.percentage}%)
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No votes yet. Be the first to vote!
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PoolView;
