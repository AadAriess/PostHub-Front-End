import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import axios from "axios";
import type { Tag, Post } from "../../types/post";
import { useSocket } from "../../context/socketContext";

// GraphQL query untuk mengambil semua tag
const GET_TAGS_QUERY = gql`
  query Tags {
    tags {
      id
      name
    }
  }
`;

interface GetTagsResponse {
  tags: Tag[];
}

function EditPostPage() {
  const router = useRouter();
  const { id } = router.query;
  const token = localStorage.getItem("authToken");

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: tagsData } = useQuery<GetTagsResponse>(GET_TAGS_QUERY);

  // Ambil data post lama
  useEffect(() => {
    if (!id) return;
    const fetchPost = async () => {
      try {
        const res = await axios.get(`http://localhost:4000/api/posts/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const post = res.data;
        setTitle(post.title);
        setContent(post.content);
        setSelectedTags(post.tags.map((t: any) => t.id));
      } catch (err) {
        console.error("Gagal memuat postingan:", err);
      }
    };
    fetchPost();
  }, [id, token]);

  const handleTagToggle = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", content);
      if (selectedFile) formData.append("image", selectedFile);
      selectedTags.forEach((tagId) => formData.append("tagIds[]", tagId));

      // PUT ke REST API
      const res = await axios.put(
        `http://localhost:4000/api/posts/${id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      alert("✅ Postingan berhasil diperbarui!");
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      setError("❌ Gagal memperbarui postingan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-6">
      <div className="bg-gray-800 p-8 rounded-xl shadow-xl w-full max-w-lg">
        <h1 className="text-2xl font-bold mb-6 text-center text-indigo-400">
          ✏️ Edit Postingan
        </h1>

        {error && (
          <div className="bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-5">
          {/* Judul */}
          <div>
            <label className="block text-gray-300 mb-2 font-medium">
              Judul
            </label>
            <input
              type="text"
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Konten */}
          <div>
            <label className="block text-gray-300 mb-2 font-medium">
              Konten
            </label>
            <textarea
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500"
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </div>

          {/* Upload Gambar */}
          <div>
            <label className="block text-gray-300 mb-2 font-medium">
              Ganti Gambar (opsional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer"
            />
          </div>

          {/* Tag */}
          <div>
            <label className="block text-gray-300 mb-2 font-medium">Tag</label>
            <div className="flex flex-wrap gap-2">
              {tagsData?.tags?.map((tag) => (
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
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition duration-200"
          >
            {loading ? "Memperbarui..." : "Simpan Perubahan"}
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

export default EditPostPage;
