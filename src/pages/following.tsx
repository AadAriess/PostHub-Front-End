import { gql } from "@apollo/client";
import { useQuery, useMutation } from "@apollo/client/react";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { FollowingListResponse } from "../types/user";

// GraphQL Query untuk mendapatkan following
const GET_FOLLOWING_LIST = gql`
  query GetFollowingList {
    getFollowingList {
      id
      firstName
      lastName
      email
    }
  }
`;

// GraphQL Query untuk mengikuti user
const FOLLOW_USER = gql`
  mutation FollowUser($followingId: Int!) {
    followUser(followingId: $followingId)
  }
`;

// GraphQL Query untuk berhenti mengikuti user
const UNFOLLOW_USER = gql`
  mutation UnfollowUser($followingId: Int!) {
    unfollowUser(followingId: $followingId)
  }
`;

export default function FollowingPage() {
  const router = useRouter();
  const { data, loading, error, refetch } =
    useQuery<FollowingListResponse>(GET_FOLLOWING_LIST);
  const [followUser] = useMutation(FOLLOW_USER);
  const [unfollowUser] = useMutation(UNFOLLOW_USER);
  const [followingIds, setFollowingIds] = useState<number[]>([]);

  useEffect(() => {
    if (data?.getFollowingList) {
      setFollowingIds(data.getFollowingList.map((u) => Number(u.id)));
    }
  }, [data]);

  const handleFollow = async (id: number) => {
    await followUser({ variables: { followingId: id } });
    setFollowingIds((prev) => [...prev, id]); // update langsung di UI
  };

  const handleUnfollow = async (id: number) => {
    await unfollowUser({ variables: { followingId: id } });
    setFollowingIds((prev) => prev.filter((uid) => uid !== id)); // update langsung di UI
  };

  if (loading) return <p className="p-6 text-gray-300">Loading...</p>;
  if (error) return <p className="p-6 text-red-500">{error.message}</p>;

  const users = data?.getFollowingList ?? [];

  return (
    <div className="p-6 bg-gray-900 min-h-screen text-gray-100">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-indigo-400">
          👣 Following List
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
            Kamu belum mengikuti siapa pun.
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

              {followingIds.includes(Number(user.id)) ? (
                <button
                  onClick={() => handleUnfollow(Number(user.id))}
                  className="bg-red-600 hover:bg-red-500 text-white px-4 py-1 rounded-lg transition duration-200"
                >
                  Unfollow
                </button>
              ) : (
                <button
                  onClick={() => handleFollow(Number(user.id))}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1 rounded-lg transition duration-200"
                >
                  Follow
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
