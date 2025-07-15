import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { supabase } from "../lib/supabaseClient";
import type { User } from "../utilities/types";
import { FaBackspace, FaPlus, FaVoteYea } from "react-icons/fa";

const EditPoll = ({ user }: { user?: User }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
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
  const { fields, append, remove } = useFieldArray({
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

  const onSubmit = async (data: any) => {
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
                className="flex items-center gap-2 cursor-pointer px-4 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200 transition"
                onClick={() => navigate(-1)}
                disabled={loading}
              >
                <FaBackspace className="h-5 w-5" /> Back
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
                      className="w-full flex items-center justify-center gap-2 cursor-pointer bg-blue-100 text-blue-700 rounded p-2 mt-2 hover:bg-blue-200 "
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
                className="w-full bg-gray-800 hover:bg-gray-900 text-white py-2 cursor-pointer rounded-lg font-semibold text-lg transition disabled:opacity-60"
                disabled={loading}
              >
                {loading ? "Updating Poll..." : "Update Poll"}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default EditPoll;
