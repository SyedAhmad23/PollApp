import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { supabase } from "../lib/supabaseClient";
import { FaPlus, FaVoteYea } from "react-icons/fa";
import { FaDeleteLeft } from "react-icons/fa6";

type PollForm = {
  question: string;
  options: string[];
  settings: {
    allowMultiple: boolean;
    showResults: boolean;
  };
  ends_at: string;
};

const EditPoll = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PollForm>({
    defaultValues: {
      question: "",
      options: ["", ""],
      settings: {
        allowMultiple: false,
        showResults: true,
      },
      ends_at: "",
    },
  });
  const { fields, append, remove } = useFieldArray<PollForm>({
    control,
    name: "options",
  });

  useEffect(() => {
    const fetchPoll = async () => {
      const { data, error } = await supabase
        .from("polls")
        .select("*")
        .eq("id", id)
        .single();
      if (error || !data) {
        toast.error("Poll not found");
        navigate("/");
        return;
      }
      reset({
        question: data.question,
        options: Array.isArray(data.options) ? data.options : ["", ""],
        settings: data.settings || { allowMultiple: false, showResults: true },
        ends_at: data.ends_at || "",
      });
      setLoading(false);
    };
    fetchPoll();
  }, [id, reset, navigate]);

  const onSubmit = async (data: PollForm) => {
    const validOptions = data.options.filter((opt: string) => opt.trim());
    if (validOptions.length < 2) {
      toast.error("Please provide at least 2 options");
      return;
    }
    setLoading(true);
    try {
      const pollData = {
        question: data.question.trim(),
        options: validOptions,
        settings: data.settings,
        ends_at: data.ends_at || null,
      };
      const { error } = await supabase
        .from("polls")
        .update(pollData)
        .eq("id", id);
      if (error) throw error;
      toast.success("Poll updated successfully!");
      navigate(`/poll/${id}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to update poll");
    } finally {
      setLoading(false);
    }
  };

  const addOption = () => {
    if (fields.length < 10) {
      append("");
    }
  };
  const removeOption = (index: number) => {
    if (fields.length > 2) {
      remove(index);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.from("polls").delete().eq("id", id);
      if (error) throw error;
      toast.success("Poll deleted!");
      navigate("/mypolls");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete poll");
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto"
        >
          <div className="bg-white rounded-xl shadow-md p-8 border border-gray-200 ">
            <div className="mb-6 flex justify-between items-center">
              <div className="flex items-center gap-2 text-2xl font-bold text-blue-600 ">
                <FaVoteYea className="h-6 w-6" /> Edit Poll
              </div>
              <button
                type="button"
                className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                onClick={() => setShowDeleteModal(true)}
                disabled={loading}
              >
                <FaDeleteLeft className="h-5 w-5" /> Delete
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Question */}
              <div>
                <label htmlFor="question" className="block font-medium mb-1">
                  Poll Question
                </label>
                <input
                  {...register("question", {
                    required: "Question is required",
                    minLength: {
                      value: 5,
                      message: "Question must be at least 5 characters",
                    },
                  })}
                  placeholder="What would you like to ask?"
                  className="mt-1 w-full border p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 "
                />
                {errors.question && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.question.message as string}
                  </p>
                )}
              </div>
              {/* Options */}
              <div>
                <label className="block font-medium mb-1">Poll Options</label>
                <div className="space-y-3 mt-2">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex gap-2">
                      <input
                        {...register(`options.${index}` as const, {
                          required:
                            index < 2 ? "This option is required" : false,
                        })}
                        placeholder={`Option ${index + 1}`}
                        className="flex-1 border p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 "
                      />
                      {fields.length > 2 && (
                        <button
                          type="button"
                          className="bg-gray-200 text-gray-800 rounded p-2 hover:bg-gray-300 "
                          onClick={() => removeOption(index)}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  {fields.length < 10 && (
                    <button
                      type="button"
                      className="w-full flex items-center justify-center gap-2 bg-blue-100 text-blue-700 rounded p-2 mt-2 hover:bg-blue-200 "
                      onClick={addOption}
                    >
                      <FaPlus className="h-4 w-4" /> Add Option
                    </button>
                  )}
                </div>
                {errors.options && (
                  <p className="text-red-500 text-sm mt-1">
                    Please provide at least 2 valid options
                  </p>
                )}
              </div>
              {/* Settings */}
              <div className="space-y-4">
                <h3 className="font-medium">Poll Settings</h3>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...register("settings.allowMultiple")}
                    id="allowMultiple"
                    className="accent-blue-600 h-4 w-4"
                  />
                  <label htmlFor="allowMultiple" className="text-gray-700 ">
                    Allow multiple selections
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...register("settings.showResults")}
                    id="showResults"
                    className="accent-blue-600 h-4 w-4"
                    defaultChecked
                  />
                  <label htmlFor="showResults" className="text-gray-700 ">
                    Show results to voters
                  </label>
                </div>
              </div>
              {/* End Date */}
              <div>
                <label htmlFor="ends_at" className="block font-medium mb-1">
                  End Date (Optional)
                </label>
                <input
                  {...register("ends_at")}
                  type="datetime-local"
                  className="mt-1 w-full border p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 "
                />
              </div>
              {/* Submit */}
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-3 rounded-lg font-semibold text-lg transition disabled:opacity-60"
                disabled={loading}
              >
                {loading ? "Updating Poll..." : "Update Poll"}
              </button>
            </form>
          </div>
        </motion.div>
        {/* Delete Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-8 shadow-xl max-w-sm w-full">
              <h2 className="text-xl font-bold mb-4 text-red-600">
                Delete Poll
              </h2>
              <p className="mb-6">
                Are you sure you want to delete this poll? This action cannot be
                undone.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                  disabled={loading}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditPoll;
