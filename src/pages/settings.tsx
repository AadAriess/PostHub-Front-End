import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { useRouter } from "next/router";
import React, { useState } from "react";
import withAuth from "../components/withAuth";
import { UserProfile, UpdateUserResponse, Address } from "../types/user";

// GraphQL Mutation untuk Update User
const UPDATE_USER_MUTATION = gql`
  mutation UpdateUser($data: UpdateUserInput!) {
    updateUser(data: $data) {
      id
      firstName
      lastName
      age
      email
      address
    }
  }
`;

// Tipe untuk data form lokal
interface FormData {
  firstName: string;
  lastName: string;
  age: number | "";
  street: string;
  city: string;
  country: string;
}

// Helper untuk mengambil data user dari LocalStorage
const getInitialUserData = (): UserProfile | null => {
  const userProfileString = localStorage.getItem("userProfile");
  if (userProfileString) {
    try {
      const profile = JSON.parse(userProfileString) as UserProfile;
      if (!profile.address) {
        profile.address = { street: "", city: "", country: "" };
      }
      return profile;
    } catch (e) {
      console.error("Gagal parse user profile dari localStorage:", e);
      return null;
    }
  }
  return null;
};

function Settings() {
  const router = useRouter();
  const initialProfile = getInitialUserData();

  // State untuk form
  const [formData, setFormData] = useState<FormData>({
    firstName: initialProfile?.firstName || "",
    lastName: initialProfile?.lastName || "",
    age: initialProfile?.age || "",
    street: initialProfile?.address?.street || "",
    city: initialProfile?.address?.city || "",
    country: initialProfile?.address?.country || "",
  });

  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error" | "";
  }>({ text: "", type: "" });
  const [email, setEmail] = useState(initialProfile?.email || "");

  // Hook Mutation
  const [updateUser, { loading }] =
    useMutation<UpdateUserResponse>(UPDATE_USER_MUTATION);

  // Handler perubahan input form
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "age" ? (value ? parseInt(value) : "") : value,
    }));
  };

  // Handler Submit Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });

    // Validasi dasar
    if (!formData.firstName || !formData.age) {
      setMessage({ text: "Nama Depan dan Usia wajib diisi!", type: "error" });
      return;
    }

    // Siapkan variabel untuk mutation
    const variables = {
      data: {
        id: Number(initialProfile?.id),
        firstName: formData.firstName,
        lastName: formData.lastName,
        age: Number(formData.age),
        address: {
          street: formData.street,
          city: formData.city,
          country: formData.country,
        },
      },
    };

    try {
      const response = await updateUser({ variables });

      if (response.data?.updateUser) {
        const updatedUser = response.data.updateUser;

        // PERBARUI localStorage setelah sukses
        const currentProfile = getInitialUserData();
        const newProfile = {
          ...currentProfile,
          id: updatedUser.id,
          firstName: updatedUser.firstName,
          lastName: formData.lastName,
          email: email,
          age: updatedUser.age,
          address: updatedUser.address as Address,
        };
        localStorage.setItem("userProfile", JSON.stringify(newProfile));

        setMessage({ text: "Profil berhasil diperbarui! 🎉", type: "success" });

        // Muat ulang header dashboard setelah kembali
        setTimeout(() => router.reload(), 1000);
      } else if (response.error) {
        setMessage({
          text: "Gagal memperbarui profil.",
          type: "error",
        });
      }
    } catch (error: any) {
      setMessage({
        text: error.message || "Terjadi error saat terhubung ke server.",
        type: "error",
      });
    }
  };

  // Tampilkan Loading/Status Awal
  if (!initialProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-6">
        <h1 className="text-3xl font-bold text-red-500 mb-4">
          Akses Ditolak! 🛑
        </h1>
        <p className="text-gray-400">
          Silakan Login untuk mengakses halaman ini.
        </p>
      </div>
    );
  }

  const { street, city, country, ...restFormData } = formData;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <div className="max-w-3xl mx-auto bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700 mt-10">
        <div className="flex justify-between items-center mb-8 border-b-4 border-indigo-500 pb-3">
          <h1 className="text-3xl font-bold text-white">
            ⚙️ Pengaturan Profil
          </h1>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition"
          >
            Kembali ke Dashboard
          </button>
        </div>

        {/* Notifikasi Status */}
        {message.text && (
          <div
            className={`p-4 mb-4 rounded-lg text-sm ${
              message.type === "success"
                ? "bg-green-600 text-white"
                : "bg-red-600 text-white"
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <h2 className="text-xl font-semibold text-indigo-400 mb-4">
            Informasi Dasar
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* First Name */}
            <label className="block">
              <span className="text-gray-400">Nama Depan</span>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm p-3 text-white focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </label>

            {/* Last Name */}
            <label className="block">
              <span className="text-gray-400">Nama Belakang</span>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm p-3 text-white focus:ring-indigo-500 focus:border-indigo-500"
              />
            </label>

            {/* Email (Disabled) */}
            <label className="block">
              <span className="text-gray-400">Email (Tidak dapat diubah)</span>
              <input
                type="email"
                name="email"
                value={email}
                disabled
                className="mt-1 block w-full bg-gray-600/50 border border-gray-600 rounded-md shadow-sm p-3 text-gray-400"
              />
            </label>

            {/* Age */}
            <label className="block">
              <span className="text-gray-400">Usia</span>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm p-3 text-white focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </label>
          </div>

          <h2 className="text-xl font-semibold text-indigo-400 mt-8 mb-4 border-t border-gray-700 pt-6">
            Alamat (Optional)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Street */}
            <label className="block md:col-span-2">
              <span className="text-gray-400">Jalan</span>
              <input
                type="text"
                name="street"
                value={formData.street}
                onChange={handleChange}
                className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm p-3 text-white focus:ring-indigo-500 focus:border-indigo-500"
              />
            </label>

            {/* City */}
            <label className="block">
              <span className="text-gray-400">Kota</span>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm p-3 text-white focus:ring-indigo-500 focus:border-indigo-500"
              />
            </label>

            {/* Country */}
            <label className="block">
              <span className="text-gray-400">Negara</span>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm p-3 text-white focus:ring-indigo-500 focus:border-indigo-500"
              />
            </label>
          </div>

          {/* Tombol Submit */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 font-semibold rounded-lg transition duration-200 ${
              loading
                ? "bg-indigo-700/50 text-gray-400 cursor-not-allowed"
                : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg hover:shadow-indigo-500/50"
            }`}
          >
            {loading ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </form>
      </div>
    </div>
  );
}

// Lindungi halaman dengan HOC withAuth
export default withAuth(Settings);
