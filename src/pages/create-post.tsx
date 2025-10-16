import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import axios from "axios";
import type { Tag } from "../types/post";

// GraphQL Query untuk semua tag
const GET_TAGS_QUERY = gql`
  query Tags {
    tags {
      id
      name
    }
  }
`;

// Tipe response untuk query Tags
interface GetTagsResponse {
  tags: Tag[];
}

// Halaman untuk membuat postingan baru
function CreatePostPage() {
  const router = useRouter();

  // State form
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [authorId, setAuthorId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ambil tag dari GraphQL
  const {
    data: tagsData,
    loading: tagsLoading,
    error: tagsError,
  } = useQuery<GetTagsResponse>(GET_TAGS_QUERY);

  // Ambil user ID dari localStorage
  useEffect(() => {
    const profileString = localStorage.getItem("userProfile");
    if (profileString) {
      const profile = JSON.parse(profileString);
      setAuthorId(profile.id);
    } else {
      router.push("/login");
    }
  }, [router]);

  // Toggle pilihan tag
  const handleTagToggle = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  // Submit form ke backend REST API (Express)
  const token = localStorage.getItem("authToken");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorId) return;

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", content);
      formData.append("authorId", authorId);
      if (selectedFile) {
        formData.append("image", selectedFile);
      }

      selectedTags.forEach((tagId) => formData.append("tagIds[]", tagId));

      await axios.post("http://localhost:4000/api/posts", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      router.push("/dashboard");
    } catch (err: any) {
      console.error(err);
      setError("Gagal membuat postingan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-6">
      <div className="bg-gray-800 p-8 rounded-xl shadow-xl w-full max-w-lg">
        <h1 className="text-2xl font-bold mb-6 text-center text-indigo-400">
          ✏️ Buat Postingan Baru
        </h1>

        {error && (
          <div className="bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Judul */}
          <div>
            <label className="block text-gray-300 mb-2 font-medium">
              Judul Postingan
            </label>
            <input
              type="text"
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Masukkan judul..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Konten */}
          <div>
            <label className="block text-gray-300 mb-2 font-medium">
              Isi Konten
            </label>
            <textarea
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={5}
              placeholder="Tulis isi postingan..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </div>

          {/* Upload File */}
          <div>
            <label className="block text-gray-300 mb-2 font-medium">
              Upload Gambar (opsional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer"
            />
          </div>

          {/* Pilihan Tag */}
          <div>
            <label className="block text-gray-300 mb-2 font-medium">
              Pilih Tag
            </label>
            {tagsLoading ? (
              <p className="text-gray-400 italic">Memuat daftar tag...</p>
            ) : tagsError ? (
              <p className="text-red-400">Gagal memuat tag.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {tagsData?.tags?.map((tag: { id: string; name: string }) => (
                  <label
                    key={tag.id}
                    className={`px-3 py-1 rounded-full border text-sm cursor-pointer transition ${
                      selectedTags.includes(tag.id)
                        ? "bg-indigo-600 border-indigo-500 text-white"
                        : "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedTags.includes(tag.id)}
                      onChange={() => handleTagToggle(tag.id)}
                      className="hidden"
                    />
                    #{tag.name}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Tombol Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition duration-200"
          >
            {loading ? "Mengunggah..." : "Buat Postingan"}
          </button>
        </form>

        <div className="text-center mt-6">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-sm text-gray-400 hover:text-indigo-400 transition duration-150"
          >
            ← Kembali ke Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreatePostPage;
