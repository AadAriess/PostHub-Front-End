import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { useRouter } from "next/router";
import { FollowerListResponse } from "../types/user";

// GraphQL Query untuk mendapatkan list follower
const GET_FOLLOWERS_LIST = gql`
  query GetFollowerList {
    getFollowerList {
      id
      firstName
      lastName
      email
    }
  }
`;

export default function FollowersPage() {
  const router = useRouter();
  const { data, loading, error } =
    useQuery<FollowerListResponse>(GET_FOLLOWERS_LIST);

  if (loading) return <p className="p-6 text-gray-300">Loading...</p>;
  if (error) return <p className="p-6 text-red-500">{error.message}</p>;

  const users = data?.getFollowerList ?? [];

  return (
    <div className="p-6 bg-gray-900 min-h-screen text-gray-100">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-indigo-400">
          🧍‍♂️ Followers List
        </h1>
        <button
          onClick={() => router.push("/dashboard")}
          className="bg-gray-700 hover:bg-gray-600 text-gray-200 px-4 py-2 rounded-lg transition duration-200 flex items-center gap-2"
        >
          <span>⬅️</span> Kembali ke Dashboard
        </button>
      </div>

      {/* Konten */}
      {users.length === 0 ? (
        <div className="p-8 bg-gray-800 border border-dashed border-gray-700 rounded-xl text-center shadow-inner">
          <p className="text-gray-400 italic text-lg">
            Tidak ada yang mengikuti kamu 😅
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {users.map((user) => (
            <li
              key={user.id}
              className="border border-gray-700 bg-gray-800 hover:bg-gray-750 p-4 rounded-lg flex justify-between items-center transition duration-200"
            >
              <div>
                <p className="font-semibold text-white">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-sm text-gray-400">{user.email}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
