import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FaPlus,
  FaSearch,
  FaChartBar,
  FaUserFriends,
  FaClock,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import type { Poll, User } from "../utilities/types";
import PollCard from "../components/PollCard";
import toast from "react-hot-toast";

const Home = ({ user }: { user?: User }) => {
  const [polls, setPolls] = useState<(Poll & { votes?: { id: string }[] })[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredPolls, setFilteredPolls] = useState<
    (Poll & { votes?: { id: string }[] })[]
  >([]);

  useEffect(() => {
    fetchPolls();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        const filtered = polls.filter((poll) =>
          poll.question.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredPolls(filtered);
      } else {
        setFilteredPolls(polls);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, polls]);

  const fetchPolls = async () => {
    try {
      const { data, error } = await supabase
        .from("polls")
        .select(`*, votes (id)`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const transformedPolls = (data || []).map((poll: any) => ({
        ...poll,
        options: Array.isArray(poll.options) ? poll.options : [],
        votes: poll.votes || [],
      }));
      setPolls(transformedPolls);
      setFilteredPolls(transformedPolls);
    } catch (error) {
      toast.error("Failed to load polls");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-48 bg-gray-200 rounded-lg animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
            Create & Share
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {" "}
              Polls
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Gather opinions, make decisions, and engage your audience with
            real-time polling
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link to="/create">
              <button className="flex items-center gap-2 px-6 py-2 cursor-pointer rounded-lg bg-gray-700 hover:bg-gray-800 text-white font-semibold text-lg transition">
                <FaPlus className="h-5 w-5" /> Create Poll
              </button>
            </Link>
            {!user && (
              <Link to="/register">
                <button className="px-6 py-2 rounded-lg border border-blue-500 cursor-pointer text-blue-600 font-semibold text-lg bg-white hover:bg-blue-50 transition">
                  Sign Up for More Features
                </button>
              </Link>
            )}
          </div>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/20"
            >
              <FaChartBar className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="text-2xl font-bold text-gray-900">
                {polls.length}
              </h3>
              <p className="text-gray-600">Active Polls</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/20"
            >
              <FaUserFriends className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <h3 className="text-2xl font-bold text-gray-900">
                {polls.reduce(
                  (acc, poll) => acc + (poll.votes?.length || 0),
                  0
                )}
              </h3>
              <p className="text-gray-600">Total Votes</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/20"
            >
              <FaClock className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
              <h3 className="text-2xl font-bold text-gray-900">Real-time</h3>
              <p className="text-gray-600">Updates</p>
            </motion.div>
          </div>
        </motion.div>
        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mb-8"
        >
          <div className="relative max-w-md mx-auto">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search polls..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full py-2 rounded-lg border border-white/20 bg-white/70 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </motion.div>
        {/* Polls Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          {filteredPolls.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPolls.map((poll, index) => (
                <motion.div
                  key={poll.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <PollCard poll={poll} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FaClock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {searchQuery ? "No polls found" : "No polls yet"}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchQuery
                  ? "Try adjusting your search terms"
                  : "Be the first to create a poll and start gathering opinions!"}
              </p>
              {!searchQuery && (
                <Link to="/create">
                  <button className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold text-lg transition">
                    <FaPlus className="h-4 w-4" /> Create First Poll
                  </button>
                </Link>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Home;
