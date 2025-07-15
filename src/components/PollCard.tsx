import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  FaCalendarAlt,
  FaUserFriends,
  FaChartBar,
  FaUser,
} from "react-icons/fa";
import type { Poll } from "../utilities/types";
import { supabase } from "../lib/supabaseClient";
import toast from "react-hot-toast";
import { BiEdit, BiTrash } from "react-icons/bi";

interface PollCardProps {
  poll: Poll & { votes?: { id: string }[] };
  user?: { id: string };
  showActions?: boolean;
  onDelete?: () => void;
}

const PollCard = ({ poll, user, showActions, onDelete }: PollCardProps) => {
  const totalVotes = poll.votes?.length || 0;
  const isActive = !poll.ends_at || new Date(poll.ends_at) > new Date();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    const { error } = await supabase.from("polls").delete().eq("id", poll.id);
    setDeleting(false);
    setShowDeleteModal(false);
    if (error) toast.error("Failed to delete poll");
    else {
      toast.success("Poll deleted!");
      if (onDelete) onDelete();
    }
  };

  return (
    <>
      <Link to={`/poll/${poll.id}`}>
        <div className="hover:shadow-lg transition-shadow cursor-pointer h-full bg-white rounded-xl shadow-md border border-gray-200 ">
          <div className="p-6 pb-2 border-b border-gray-100 ">
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-semibold line-clamp-2 text-gray-900 ">
                {poll.question}
              </h3>
              <span
                className={`px-2 py-1 rounded text-xs font-semibold ${
                  isActive
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {isActive ? "Active" : "Ended"}
              </span>
            </div>
          </div>
          <div className="p-6 pt-2 flex items-center justify-between text-sm text-gray-600 ">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <FaUserFriends className="h-4 w-4" />
                <span>{totalVotes} votes</span>
              </div>
              <div className="flex items-center gap-1">
                <FaChartBar className="h-4 w-4" />
                <span>{poll.options.length} options</span>
              </div>
            </div>
            {poll.email && (
              <div className="flex items-center gap-1">
                <FaUser className="h-4 w-4" />
                <span>{poll.email}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <FaCalendarAlt className="h-4 w-4" />
              <span>{new Date(poll.created_at).toLocaleDateString()}</span>
            </div>
          </div>
          {showActions && user?.id === poll.created_by && (
            <div className="flex gap-2 mt-4 px-4 pb-4">
              <Link
                to={`/edit/${poll.id}`}
                className="flex items-center gap-1 px-3 py-2 rounded-lg border border-blue-600 text-blue-600 hover:bg-blue-50 transition text-sm"
              >
                <BiEdit className="h-4 w-4" />
                <span>Edit</span>
              </Link>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setShowDeleteModal(true);
                }}
                className="flex items-center gap-1 px-3 py-2 rounded-lg border border-red-500 text-red-500 hover:bg-red-50 transition text-sm"
              >
                <BiTrash className="h-4 w-4" />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </Link>
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 shadow-xl max-w-sm w-full">
            <h2 className="text-xl font-bold mb-4 text-red-600">Delete Poll</h2>
            <p className="mb-6">
              Are you sure you want to delete this poll? This action cannot be
              undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PollCard;
