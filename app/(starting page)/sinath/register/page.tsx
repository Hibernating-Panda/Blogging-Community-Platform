"use client";

import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";

const Register: React.FC = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRegister = () => {
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    console.log("Register attempt:", { username, email, password, confirmPassword });
    // Add your registration logic here
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-100 to-gray-200 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-300 rounded-3xl shadow-2xl p-8 sm:p-10 md:p-12">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center overflow-hidden">
              <Image
                src="/Logo.png"
                alt="Logo"
                width={96}
                height={96}
                className="object-contain"
              />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-center text-2xl sm:text-xl font-serif mb-8">
            Welcome back to <span className="text-blue-600">research <span className="text-amber-300">hub</span></span>
          </h1>

          {/* Username Field */}
          <div className="mb-6">
            <label htmlFor="username" className="block text-lg font-serif mb-2">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-full bg-white border-0 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>

          {/* Email Field */}
          <div className="mb-6">
            <label htmlFor="email" className="block text-lg font-serif mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-full bg-white border-0 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>

          {/* Password Field */}
          <div className="mb-6">
            <label htmlFor="password" className="block text-lg font-serif mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-full bg-white border-0 focus:ring-2 focus:ring-blue-500 outline-none transition-all pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Confirm Password Field */}
          <div className="mb-8">
            <label
              htmlFor="confirmPassword"
              className="block text-lg font-serif mb-2"
            >
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-full bg-white border-0 focus:ring-2 focus:ring-blue-500 outline-none transition-all pr-12"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800"
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Register Button */}
          <button
            type="button"
            onClick={handleRegister}
            className="w-full bg-gray-800 hover:bg-gray-900 text-white font-serif text-lg py-3 rounded-full transition-colors duration-200 mb-6"
          >
            Register
          </button>

          {/* Sign In Link */}
          <p className="text-center font-serif text-base">
            Already have an account?{" "}
            <a
              href="/sign_in"
              className="text-blue-600 hover:text-blue-700 underline"
            >
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
