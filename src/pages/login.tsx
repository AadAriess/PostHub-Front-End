import React, { useState } from "react";
import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { useRouter } from "next/router";
import Link from "next/link";
import { LoginResponse } from "../types/auth";

// Tipe untuk input mutation login
interface LoginMutationVariables {
  email: string;
  password: string;
}

// Tipe untuk state form
type LoginFormState = LoginMutationVariables;

// GraphQL Mutation
const LOGIN_USER_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        id
        email
        firstName
      }
    }
  }
`;

function LoginPage() {
  const router = useRouter();

  const [formData, setFormData] = useState<LoginFormState>({
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);

  // Apollo Mutation Hook
  const [loginUser, { loading }] = useMutation<
    LoginResponse,
    LoginMutationVariables
  >(LOGIN_USER_MUTATION, {
    onCompleted: (data) => {
      const token = data.login.token;
      const user = data.login.user;

      // Simpan data di Local Storage
      localStorage.setItem("authToken", token);
      localStorage.setItem("userProfile", JSON.stringify(user));

      // Redirect ke halaman dashboard
      router.push("/dashboard");
    },
    onError: (err) => {
      // Menghilangkan awalan "GraphQL error: " jika ada
      const errorMessage = err.message.replace("GraphQL error: ", "");
      setError(errorMessage);
    },
  });

  // Form Handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    try {
      await loginUser({
        variables: formData,
      });
    } catch (err) {
      // Error ditangani di onError
    }
  };

  return (
    // Background utama Dark Mode
    <div className="min-h-screen flex items-center justify-center bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      {/* Login Card/Form Container */}
      <div className="max-w-md w-full space-y-8 bg-gray-800 p-10 rounded-xl shadow-2xl border border-gray-700">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Masuk ke PostHUB 🔐
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Gunakan akun yang sudah terdaftar
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* Error Message */}
          {error && (
            <div
              className="bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded relative"
              role="alert"
            >
              <span className="block sm:inline font-medium">Gagal Login:</span>{" "}
              {error}
            </div>
          )}

          <div className="rounded-md shadow-sm space-y-4">
            {/* Email Input */}
            <div>
              <label htmlFor="email-address" className="sr-only">
                Alamat Email
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none relative block w-full px-3 py-3 border border-gray-600 bg-gray-700 placeholder-gray-400 text-white rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150"
                placeholder="Alamat Email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none relative block w-full px-3 py-3 border border-gray-600 bg-gray-700 placeholder-gray-400 text-white rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white ${
                loading
                  ? "bg-indigo-500 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-800"
              } transition duration-150`}
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Memuat...
                </>
              ) : (
                "Login"
              )}
            </button>
          </div>
        </form>

        {/* Link ke Register */}
        <div className="text-center">
          <p className="text-sm text-gray-400">
            Belum punya akun?{" "}
            <Link href="/register" legacyBehavior>
              <a className="font-medium text-indigo-400 hover:text-indigo-300 transition duration-150">
                Register di sini
              </a>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
