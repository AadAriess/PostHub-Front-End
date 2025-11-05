import { useQuery, useMutation } from "@apollo/client/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { gql } from "@apollo/client";
import {
  AllUsersResponse,
  FollowingListResponse,
  FollowUserResponse,
  UnfollowUserResponse,
  UserProfile,
} from "../types/user";

// GraphQL Query untuk mendapatkan semua user
const GET_ALL_USERS = gql`
  query AllUsers {
    allUsers {
      id
      firstName
      lastName
      email
    }
  }
`;

// GraphQL Query untuk mendapatkan daftar following user
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

export default function UsersPage() {
  const router = useRouter();
  const { data, loading, error } = useQuery<AllUsersResponse>(GET_ALL_USERS);
  const { data: followingData } =
    useQuery<FollowingListResponse>(GET_FOLLOWING_LIST);

  const [followUser] = useMutation<FollowUserResponse>(FOLLOW_USER);
  const [unfollowUser] = useMutation<UnfollowUserResponse>(UNFOLLOW_USER);

  const [followingIds, setFollowingIds] = useState<number[]>([]);

  useEffect(() => {
    if (followingData?.getFollowingList) {
      setFollowingIds(followingData.getFollowingList.map((u) => Number(u.id)));
    }
  }, [followingData]);

  const handleFollow = async (id: number) => {
    try {
      await followUser({ variables: { followingId: id } });
      setFollowingIds((prev) => [...prev, id]); // Update UI langsung
    } catch (err) {
      console.error(err);
    }
  };

  const handleUnfollow = async (id: number) => {
    try {
      await unfollowUser({ variables: { followingId: id } });
      setFollowingIds((prev) => prev.filter((fid) => fid !== id)); // Update UI langsung
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <p className="p-6">Loading...</p>;
  if (error) return <p className="p-6 text-red-500">{error.message}</p>;

  const users = data?.allUsers ?? [];

  return (
    <div className="p-6 bg-gray-900 min-h-screen text-gray-100">
      {/* Tombol Kembali ke Dashboard */}
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-indigo-400">👥 Semua User</h1>
        <button
          onClick={() => router.push("/dashboard")}
          className="bg-gray-700 hover:bg-gray-600 text-gray-200 px-4 py-2 rounded-lg transition duration-200 flex items-center gap-2"
        >
          <span>⬅️</span> Kembali ke Dashboard
        </button>
      </div>

      {users.length === 0 ? (
        <p className="text-gray-400">Tidak ada user lain.</p>
      ) : (
        <ul className="space-y-3">
          {users.map((user: UserProfile) => (
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
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition duration-200"
                >
                  Unfollow
                </button>
              ) : (
                <button
                  onClick={() => handleFollow(Number(user.id))}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition duration-200"
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
