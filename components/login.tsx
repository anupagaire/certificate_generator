"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async () => {
    setError("");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const errData = await res.json();
        setError(errData.error || "Login failed");
        return;
      }

      const data = await res.json();

      if (data.success) {
        localStorage.setItem("user-name", data.name);
        router.push("/dashboard");
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err) {
      console.error(err);
      setError("Server error");
    }
  };

  return (
    <div
      className=" min-h-screen 
        flex items-center justify-center 
         dark:bg-white
        transition-colors duration-300
      "
    >
      <div
        className="
          bg-white dark:bg-gray-800
          shadow-xl
          rounded-2xl
          p-8
          w-full
          max-w-md
        "
      >
        <h1
          className="
            text-3xl font-bold text-center mb-6
            text-gray-800 dark:text-white
          "
        >
          Welcome
        </h1>

        {error && (
          <p
            className="
              bg-red-100 dark:bg-red-900
              text-red-600 dark:text-red-300
              p-2 rounded mb-4 text-sm text-center
            "
          >
            {error}
          </p>
        )}

        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="
              w-full px-4 py-2 border rounded-lg
              bg-white dark:bg-gray-700
              border-gray-300 dark:border-gray-600
              text-gray-800 dark:text-white
              focus:outline-none focus:ring-2 focus:ring-indigo-500
            "
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            className="
              w-full px-4 py-2 border rounded-lg
              bg-white dark:bg-gray-700
              border-gray-300 dark:border-gray-600
              text-gray-800 dark:text-white
              focus:outline-none focus:ring-2 focus:ring-indigo-500
            "
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            type="button"
            onClick={handleLogin}
            className="
              w-full
              bg-indigo-600 hover:bg-indigo-700
              text-white
              py-2
              rounded-lg
              font-semibold
              transition
            "
          >
            Login
          </button>
        </div>

        <p
          className="
            text-center text-gray-500 dark:text-gray-400
            text-sm mt-6
          "
        >
          Demo: admin@gmail.com / admin123
        </p>
      </div>
    </div>
  );
}
