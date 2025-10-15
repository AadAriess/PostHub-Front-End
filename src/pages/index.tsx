import React from "react";
import Link from "next/link";
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { Post, GetAllPostsResponse } from "../types/post";

// GraphQL Query (Sama seperti di Dashboard)
const GET_ALL_POSTS_QUERY = gql`
  query GetAllPosts {
    getAllPosts {
      id
      title
      content
      author {
        id
        firstName
        lastName
      }
      tags {
        id
        name
      }
    }
  }
`;

function PostCard({ post, index }: { post: Post; index: number }) {
  // Simulasikan data yang tidak ada di GraphQL saat ini (likes, timestamp)
  const simulatedLikes = (index + 1) * 30 + 12;
  const simulatedTimestamp =
    index % 3 === 0
      ? "2 jam lalu"
      : index % 3 === 1
      ? "5 jam lalu"
      : "1 hari lalu";

  // Komponen Kartu Postingan (Dark Mode)
  return (
    <div
      key={post.id}
      className="bg-gray-800 p-6 border border-gray-700 rounded-xl shadow-2xl hover:shadow-indigo-500/30 transition duration-300 transform hover:-translate-y-1 flex flex-col justify-between"
    >
      <div>
        <h2 className="text-2xl font-bold text-white mb-3 border-l-4 border-indigo-500 pl-3">
          {post.title}
        </h2>
        <p className="text-gray-400 text-sm mb-4 line-clamp-4">
          {post.content}
        </p>
      </div>

      <div>
        <div className="flex justify-between items-center text-xs text-gray-500 pt-3 border-t border-gray-700 mt-4">
          <span className="font-medium text-gray-400">
            Oleh: {post.author.firstName} {post.author.lastName}
          </span>
          <span>{simulatedTimestamp}</span>{" "}
          {/* Menggunakan timestamp simulasi */}
        </div>

        {/* Aksi Postingan */}
        <div className="flex gap-4 mt-4">
          <button className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition duration-150">
            <span className="text-lg">👍</span>
            {simulatedLikes} Suka {/* Menggunakan likes simulasi */}
          </button>
          <Link href={`/post/${post.id}`} legacyBehavior>
            <a className="flex items-center gap-1 text-gray-400 hover:text-white transition duration-150">
              <span className="text-lg">💬</span>
              Lihat & Komentar
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  // Panggil useQuery untuk mengambil data postingan dari server
  const { data, loading, error } =
    useQuery<GetAllPostsResponse>(GET_ALL_POSTS_QUERY);

  // Penanganan Status
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center">
        <p className="text-xl text-indigo-400">Memuat Postingan...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 p-8">
        <h1 className="text-3xl font-bold text-red-500 mb-4">
          Terjadi Kesalahan!
        </h1>
        <p className="text-gray-400">
          Gagal memuat data dari server: {error.message}
        </p>
      </div>
    );
  }

  const posts = data?.getAllPosts || [];

  return (
    // Background utama Dark Mode
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Header Navigasi PostHUB */}
      <header className="bg-gray-800 shadow-xl p-6 sticky top-0 z-10 border-b border-gray-700">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          {/* Logo */}
          <Link href="/" legacyBehavior>
            <a className="text-3xl font-extrabold text-indigo-400 hover:text-indigo-300 transition duration-300">
              PostHUB
            </a>
          </Link>

          {/* Navigasi Auth */}
          <div className="flex gap-4">
            <Link href="/login" legacyBehavior>
              <a className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900">
                Login
              </a>
            </Link>
            <Link href="/register" legacyBehavior>
              <a className="px-4 py-2 bg-gray-700 text-gray-200 font-semibold rounded-lg shadow-md hover:bg-gray-600 transition duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900">
                Register
              </a>
            </Link>
          </div>
        </div>
      </header>

      {/* Konten Utama - Post Feed */}
      <main className="max-w-7xl mx-auto p-6 lg:p-8">
        <section className="mt-8">
          <h1 className="text-3xl font-bold text-white mb-8 border-b-4 border-indigo-500 pb-2 inline-block">
            Postingan Populer Hari Ini
          </h1>

          {/* Grid Postingan */}
          <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, index) => (
              <PostCard key={post.id} post={post} index={index} />
            ))}
          </div>

          {/* Placeholder/Call to action jika tidak ada post */}
          {posts.length === 0 && (
            <div className="p-12 bg-gray-800 border border-dashed border-gray-700 rounded-xl text-center shadow-inner">
              <p className="text-gray-400 italic text-xl">
                Saat ini belum ada postingan publik.
              </p>
              <p className="mt-3 text-indigo-400 font-semibold">
                Silakan Login atau Register untuk membuat postingan pertama
                Anda!
              </p>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 border-t border-gray-700 mt-12 p-4 text-center text-gray-500">
        &copy; {new Date().getFullYear()} PostHUB. All rights reserved.
      </footer>
    </div>
  );
}
