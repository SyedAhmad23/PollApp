import { useForm } from "react-hook-form";
import { supabase } from "../lib/supabaseClient";
import toast from "react-hot-toast";
import type { Auth, User } from "../utilities/types";
import { motion } from "framer-motion";

export default function Register({ user }: { user?: User }) {
  const { register, handleSubmit } = useForm<Auth>();

  const onSubmit = async (data: Auth) => {
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Check your inbox to confirm registration!");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-1 flex items-center justify-center">
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit(onSubmit)}
          className="w-full max-w-sm bg-white  p-8 rounded-xl shadow-lg border border-gray-200"
        >
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-900 ">
            Register for PollApp
          </h2>
          <div className="mb-4">
            <input
              {...register("email", { required: true })}
              placeholder="Email"
              className="input w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
              type="email"
              autoComplete="email"
            />
          </div>
          <div className="mb-6">
            <input
              {...register("password", { required: true })}
              type="password"
              placeholder="Password"
              className="input w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500   "
              autoComplete="new-password"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-gray-700 text-white py-2 rounded-lg cursor-pointer font-semibold hover:bg-gray-800 transition mb-2"
          >
            Register
          </button>
          <p className="text-center text-gray-500 dark:text-gray-400 text-sm mt-4">
            Already have an account?{" "}
            <a
              href="/login"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Login
            </a>
          </p>
        </motion.form>
      </main>
    </div>
  );
}
