import React, { useState } from "react";
import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { useRouter } from "next/router";
import Link from "next/link";
import { RegisterInput, RegisterResponse } from "../types/auth";

// Tipe untuk state form
type RegisterFormState = Omit<RegisterInput, "age" | "address"> &
  Omit<RegisterInput["address"], ""> & {
    age: string;
    street: string;
    city: string;
    country: string;
  };

// Mutation GraphQL
const REGISTER_USER_MUTATION = gql`
  mutation RegisterWithJsonData($data: RegisterInput!) {
    register(data: $data) {
      token
      user {
        id
        email
        firstName
        lastName
        address
      }
    }
  }
`;

function RegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState<RegisterFormState>({
    firstName: "",
    lastName: "",
    age: "",
    email: "",
    password: "",
    street: "",
    city: "",
    country: "",
  });
  const [error, setError] = useState<string | null>(null);

  // Apollo Mutation Hook
  const [registerUser, { loading }] = useMutation<
    RegisterResponse,
    { data: RegisterInput }
  >(REGISTER_USER_MUTATION, {
    onCompleted: (data) => {
      const token = data.register.token;
      const userProfile = data.register.user;

      // Simpan data di Local Storage
      localStorage.setItem("authToken", token);
      localStorage.setItem("userProfile", JSON.stringify(userProfile));

      // Redirect ke halaman dashboard
      router.push("/dashboard");
    },
    onError: (err) => {
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

    // Persiapan data sesuai tipe RegisterInput
    const dataToSend: RegisterInput = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      age: parseInt(formData.age),
      email: formData.email,
      password: formData.password,
      address: {
        street: formData.street,
        city: formData.city,
        country: formData.country,
      },
    };

    try {
      await registerUser({ variables: { data: dataToSend } });
    } catch (err) {
      // Error ditangani di onError
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      {/* Register Card/Form Container */}
      <div className="max-w-xl w-full space-y-8 bg-gray-800 p-10 rounded-xl shadow-2xl border border-gray-700">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Daftar Akun Baru 📝
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Daftar untuk mengakses Dashboard
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* Error Message */}
          {error && (
            <div
              className="bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded relative"
              role="alert"
            >
              <span className="block sm:inline font-medium">
                Gagal Registrasi:
              </span>{" "}
              {error}
            </div>
          )}

          {/* Bagian 1: Data Pribadi */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-indigo-400 border-b border-gray-700 pb-2">
              Data Pengguna
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                name="firstName"
                type="text"
                placeholder="Nama Depan"
                value={formData.firstName}
                onChange={handleChange}
              />
              <Input
                name="lastName"
                type="text"
                placeholder="Nama Belakang"
                value={formData.lastName}
                onChange={handleChange}
              />
            </div>

            <Input
              name="age"
              type="number"
              placeholder="Umur"
              value={formData.age}
              onChange={handleChange}
            />
            <Input
              name="email"
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
            />
            <Input
              name="password"
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          {/* Bagian 2: Alamat */}
          <div className="space-y-4 pt-4">
            <h3 className="text-lg font-semibold text-indigo-400 border-b border-gray-700 pb-2">
              Alamat
            </h3>

            <Input
              name="street"
              type="text"
              placeholder="Jalan"
              value={formData.street}
              onChange={handleChange}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                name="city"
                type="text"
                placeholder="Kota"
                value={formData.city}
                onChange={handleChange}
              />
              <Input
                name="country"
                type="text"
                placeholder="Negara"
                value={formData.country}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-6">
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
                  Mendaftar...
                </>
              ) : (
                "Register Akun"
              )}
            </button>
          </div>
        </form>

        {/* Link ke Login */}
        <div className="text-center">
          <p className="text-sm text-gray-400">
            Sudah punya akun?{" "}
            <Link href="/login" legacyBehavior>
              <a className="font-medium text-indigo-400 hover:text-indigo-300 transition duration-150">
                Login di sini
              </a>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  name: keyof RegisterFormState;
}

const Input: React.FC<InputProps> = ({ name, placeholder, ...props }) => (
  <div className="relative">
    <label htmlFor={name} className="sr-only">
      {placeholder}
    </label>
    <input
      id={name}
      name={name}
      required
      {...props}
      className="appearance-none relative block w-full px-3 py-3 border border-gray-600 bg-gray-700 placeholder-gray-400 text-white rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150"
      placeholder={placeholder}
    />
  </div>
);
