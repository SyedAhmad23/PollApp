import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { supabase } from "../lib/supabaseClient";
import type { User } from "../utilities/types";
import { FaPlus, FaVoteYea } from "react-icons/fa";

//  Generate random IP hash for tracking
const generateIPHash = () => {
  return (
    "anon_" + Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
  );
};

type PollForm = {
  question: string;
  options: string[];
  settings: {
    allowMultiple: boolean;
    showResults: boolean;
  };
  ends_at: string;
};

const CreatePoll = ({ user }: { user?: User }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
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
        created_by: user?.id,
        ends_at: data.ends_at || null,
      };
      const { data: poll, error } = await supabase
        .from("polls")
        .insert([pollData])
        .select()
        .single();
      if (error) throw error;
      if (!user) {
        const anonymousPolls = JSON.parse(
          localStorage.getItem("anonymousPolls") || "[]"
        );
        anonymousPolls.push(poll.id);
        localStorage.setItem("anonymousPolls", JSON.stringify(anonymousPolls));
        const anonId =
          localStorage.getItem("anonymousUserId") || generateIPHash();
        localStorage.setItem("anonymousUserId", anonId);
      }
      toast.success("Poll created successfully!");
      reset();
      navigate(`/poll/${poll.id}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to create poll");
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
            <div className="mb-6">
              <div className="flex items-center gap-2 text-2xl font-bold text-blue-600 ">
                <FaVoteYea className="h-6 w-6" /> Create New Poll
              </div>
              {!user && (
                <p className="text-sm text-gray-600 mt-2">
                  Creating as anonymous user - your poll will be tracked locally
                </p>
              )}
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
                {loading ? "Creating Poll..." : "Create Poll"}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CreatePoll;
