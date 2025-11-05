import { gql } from "@apollo/client";
import { useQuery, useLazyQuery } from "@apollo/client/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import withAuth from "../components/withAuth";
import { GetAllPostsResponse, FilterPostsResponse } from "../types/post";
import { FeedResponse } from "../types/feed";
import FilterBuilder from "../components/FilterBuilder";
import { FilterGroup } from "../types/filter";
import { io } from "socket.io-client";
import { GetNotificationsResponse, Notification } from "../types/notifications";

// GraphQL Query untuk feed
const GET_FEED_QUERY = gql`
  query Feed {
    feed {
      id
      title
      content
      createdAt
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

// GraphQL Query untuk semua postingan
const GET_ALL_POSTS_QUERY = gql`
  query GetAllPosts {
    getAllPosts {
      id
      title
      content
      createdAt
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

// GraphQL Query untuk memfilter postingan berdasarkan kriteria tertentu
const FILTER_POSTS_QUERY = gql`
  query FilterPosts($filters: FilterGroupInput!) {
    filterPosts(filters: $filters) {
      id
      title
      content
      createdAt
      tags {
        id
        name
      }
      author {
        id
        firstName
        lastName
      }
    }
  }
`;

// GraphQL Query untuk Notifikasi
const GET_NOTIFICATIONS_QUERY = gql`
  query GetMyNotifications {
    myNotifications(limit: 5) {
      id
      type
      recipient {
        id
        firstName
      }
      triggerer {
        id
        firstName
      }
      # Menambahkan entityType dan entityId sesuai dengan entitas backend
      entityType
      entityId
    }
  }
`;

// Helper untuk membuat pesan notifikasi yang lebih mudah dibaca
const formatNotificationMessage = (notif: Notification): string => {
  switch (notif.type) {
    case "COMMENT":
      return `${notif.triggerer.firstName} mengomentari postingan Anda.`;
    case "MENTION":
      return `${notif.triggerer.firstName} menyebut Anda dalam sebuah konten.`;
    default:
      return `${notif.triggerer.firstName} melakukan aksi baru.`;
  }
};

function Dashboard() {
  const router = useRouter();

  // State
  const [isClient, setIsClient] = useState(false);
  const [userName, setUserName] = useState<string>("Pengguna");
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] =
    useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<FilterGroup>({
    operator: "AND",
    conditions: [],
    groups: [],
  });
  const [isFeedMode, setIsFeedMode] = useState(false);

  // Hook Data Fetching Apollo untuk Postingan
  const {
    data: postsData,
    loading: postsLoading,
    error: postsError,
  } = useQuery<GetAllPostsResponse>(GET_ALL_POSTS_QUERY, {
    skip: !isClient,
    fetchPolicy: "network-only",
  });

  // Hook Data Fetching Apollo untuk Feed
  const {
    data: feedData,
    loading: feedLoading,
    error: feedError,
    refetch: refetchFeed,
  } = useQuery<FeedResponse>(GET_FEED_QUERY, {
    skip: !isClient,
    fetchPolicy: "network-only",
  });

  const loadFeed = async () => {
    try {
      const result = await refetchFeed();
      if (result?.data?.feed) {
        setPosts(result.data.feed);
      } else {
        console.warn("⚠️ Feed kosong atau belum tersedia");
        setPosts([]);
      }
    } catch (err) {
      console.error("❌ Gagal memuat personalized feed:", err);
    }
  };

  // Hook Data Fetching Apollo untuk Filter Postingan
  const [runFilterPosts, { data: filterData }] =
    useLazyQuery<FilterPostsResponse>(FILTER_POSTS_QUERY);

  // Hook Data Fetching Notifikasi
  const {
    data: notifData,
    loading: notifLoading,
    error: notifError,
  } = useQuery<GetNotificationsResponse>(GET_NOTIFICATIONS_QUERY, {
    skip: !isClient,
    pollInterval: 60000, // Ambil ulang data setiap 60 detik
    fetchPolicy: "network-only",
  });

  // Ambil data awal dari GraphQL
  useEffect(() => {
    if (postsData?.getAllPosts) {
      setPosts(postsData.getAllPosts);
    }
  }, [postsData]);

  // Update posts ketika filterData berubah
  useEffect(() => {
    if (filterData?.filterPosts) setPosts(filterData.filterPosts);
  }, [filterData]);

  // Update posts ketika feedData berubah
  useEffect(() => {
    if (feedData?.feed) {
      setPosts(feedData.feed);
    }
  }, [feedData]);

  // SOCKET.IO Listener
  useEffect(() => {
    const socket = io("http://localhost:4000");

    socket.on("connect", () => {
      console.log("✅ Connected to WebSocket server");
    });

    socket.on("post:new", (newPost) => {
      console.log("🔥 Post baru diterima:", newPost);
      setPosts((prev) => [newPost, ...prev]);
    });

    return () => {
      socket.off("post:new");
      socket.disconnect();
    };
  }, []);

  // Effect untuk Hydration, Ambil Nama User, dan Listener Global
  useEffect(() => {
    setIsClient(true);
    const userProfileString = localStorage.getItem("userProfile");

    if (userProfileString) {
      try {
        const userProfile = JSON.parse(userProfileString);
        if (userProfile.firstName) {
          setUserName(userProfile.firstName);
        } else if (userProfile.email) {
          setUserName(userProfile.email.split("@")[0]);
        }
      } catch (e) {
        console.error("Gagal parse user profile:", e);
      }
    }

    // Global listener untuk menutup dropdown ketika klik di luar
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Hanya tutup jika klik BUKAN bagian dari kontrol header
      if (!target.closest(".header-controls")) {
        setShowProfileDropdown(false);
        setShowNotificationDropdown(false);
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);

  // Handler untuk menerapkan filter
  const applyFilter = async () => {
    try {
      console.log("📤 Mengirim filter:", JSON.stringify(filters, null, 2));

      await runFilterPosts({
        variables: {
          filters,
        },
      });

      setIsFilterOpen(false);
    } catch (err) {
      console.error("❌ Gagal memfilter:", err);
    }
  };

  // Handler untuk mereset filter
  const resetFilter = async () => {
    const emptyFilter: FilterGroup = {
      operator: "AND",
      conditions: [],
      groups: [],
    };
    setFilters(emptyFilter);
    try {
      const { data } = await runFilterPosts({
        variables: { filters: emptyFilter },
      });
      if (data?.filterPosts) {
        setPosts(data.filterPosts);
      }
    } catch (err) {
      console.error("❌ Gagal reset filter:", err);
    }
  };

  // Handler Logout
  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userProfile");
    router.push("/");
  };

  // Handler Navigasi Setting (Contoh)
  const goToSettings = () => {
    setShowProfileDropdown(false);
    router.push("/settings");
  };

  // Handler Toggle Feed Mode
  const toggleFeedMode = async () => {
    if (isFeedMode) {
      // kembali ke semua postingan
      if (postsData?.getAllPosts) {
        setPosts(postsData.getAllPosts);
      }
    } else {
      // ambil feed pribadi
      await loadFeed();
    }
    setIsFeedMode(!isFeedMode);
  };

  // Tampilkan Loading/Status Awal
  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <h1 className="text-3xl font-bold text-indigo-400">
          Memuat Dashboard... ⚙️
        </h1>
      </div>
    );
  }

  // Tampilkan status Loading/Error dari Apollo
  if (postsLoading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <h1 className="text-3xl font-bold text-indigo-400">
          Memuat Data Postingan... ⏳
        </h1>
      </div>
    );

  if (postsError)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-6">
        <h1 className="text-3xl font-bold text-red-500 mb-4">
          Terjadi Kesalahan saat memuat postingan 😢
        </h1>
        <p className="text-gray-400">Error: {postsError.message}</p>
      </div>
    );

  const notifications: Notification[] = notifData?.myNotifications || [];
  const unreadCount = notifications.length;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Header Dashboard BARU */}
      <header className="bg-gray-800 shadow-xl p-6 sticky top-0 z-10 border-b border-gray-700">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white">
              PostHUB
            </h1>
            <h2 className="text-lg text-gray-400 mt-1">
              Selamat Datang,{" "}
              <span className="font-semibold text-indigo-400">{userName}</span>!
            </h2>
          </div>
          {/* Ikon Kontrol (Lonceng & Profil) */}
          <div className="flex gap-4 items-center header-controls relative">
            {/* Ikon Lonceng Notifikasi */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotificationDropdown(!showNotificationDropdown);
                  setShowProfileDropdown(false);
                }}
                className="p-3 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition duration-200 relative"
                aria-label="Notifikasi"
              >
                {/* Ikon Lonceng (Bell Icon) */}
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3 3 0 11-6 0m6 0v2"
                  ></path>
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Dropdown Notifikasi */}
              {showNotificationDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-gray-800 rounded-lg shadow-xl py-2 border border-gray-700 z-20 origin-top-right animate-fade-in">
                  <div className="px-4 py-2 font-semibold text-white border-b border-gray-700">
                    Notifikasi Terbaru ({unreadCount})
                  </div>
                  {notifLoading ? (
                    <div className="text-gray-400 p-4 text-sm text-center">
                      Memuat notifikasi...
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="text-gray-400 p-4 text-sm text-center">
                      Tidak ada notifikasi baru.
                    </div>
                  ) : (
                    // Mapping notifikasi
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className="block px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 cursor-pointer transition duration-150 border-b border-gray-700 last:border-b-0"
                      >
                        {formatNotificationMessage(notif)}
                      </div>
                    ))
                  )}
                  <div className="text-center p-2 border-t border-gray-700">
                    <a
                      href="#"
                      className="text-xs text-indigo-400 hover:text-indigo-300"
                    >
                      Lihat Semua Notifikasi
                    </a>
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => setIsFilterOpen(true)}
                className="bg-indigo-600 px-4 py-2 rounded-lg text-white hover:bg-indigo-700"
              >
                Filter
              </button>

              {/* Modal Filter */}
              {isFilterOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-gray-900 p-6 rounded-lg shadow-lg w-[700px] max-h-[90vh] overflow-y-auto">
                    <h2 className="text-xl font-semibold text-white mb-4">
                      Filter Builder
                    </h2>

                    <FilterBuilder group={filters} onChange={setFilters} />

                    <div className="mt-6 flex justify-end gap-3">
                      <button
                        onClick={() => setIsFilterOpen(false)}
                        className="px-4 py-2 bg-gray-700 rounded text-gray-200 hover:bg-gray-600"
                      >
                        Batal
                      </button>
                      <button
                        onClick={resetFilter}
                        className="px-4 py-2 bg-gray-700 rounded text-gray-200 hover:bg-gray-600"
                      >
                        Reset
                      </button>
                      <button
                        onClick={applyFilter}
                        className="px-4 py-2 bg-indigo-600 rounded text-white hover:bg-indigo-700"
                      >
                        Terapkan Filter
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={toggleFeedMode}
                className={`px-4 py-2 rounded-lg font-semibold transition duration-200 ${
                  isFeedMode
                    ? "bg-indigo-600 text-white hover:bg-indigo-700"
                    : "bg-gray-600 text-gray-200 hover:bg-gray-700"
                }`}
              >
                {isFeedMode ? "🔙 Semua Postingan" : "👥 Feed Saya"}
              </button>
            </div>

            <div className="relative">
              <button
                onClick={() => router.push("/users")}
                className="px-4 py-2 bg-indigo-600 text-gray-200 rounded-lg font-semibold hover:bg-indigo-700 transition duration-200"
              >
                👤 Semua User
              </button>
            </div>

            <div className="relative">
              {/* Tombol Buat Postingan Baru */}
              <button
                onClick={() => router.push("/create-post")}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-200 flex items-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 4v16m8-8H4"
                  ></path>
                </svg>
                Buat Postingan Baru
              </button>
            </div>

            {/* Ikon Profil & Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowProfileDropdown(!showProfileDropdown);
                  setShowNotificationDropdown(false);
                }}
                className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg hover:ring-2 ring-indigo-500 transition duration-200 shadow-md"
                aria-label="Menu Profil"
              >
                {userName ? userName[0].toUpperCase() : "P"}
              </button>

              {/* Dropdown Menu */}
              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-xl py-2 border border-gray-700 z-20 origin-top-right animate-fade-in">
                  <div className="px-4 py-2 font-semibold text-white truncate border-b border-gray-700">
                    Hi, {userName}!
                  </div>
                  <a
                    onClick={goToSettings}
                    className="block px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white cursor-pointer transition duration-150"
                  >
                    <span className="mr-2">🛠️</span> Pengaturan
                  </a>
                  <a
                    onClick={() => router.push("/following")}
                    className="block px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white cursor-pointer transition duration-150"
                  >
                    <span className="mr-2">👣</span> Following List
                  </a>
                  <a
                    onClick={() => router.push("/followers")}
                    className="block px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white cursor-pointer transition duration-150 border-b border-gray-700"
                  >
                    <span className="mr-2">🧍‍♂️</span> Followers List
                  </a>
                  <a
                    onClick={handleLogout}
                    className="block px-4 py-2 text-red-400 hover:bg-gray-700 hover:text-red-300 cursor-pointer border-t border-gray-700 mt-1 pt-1 transition duration-150"
                  >
                    <span className="mr-2">🚪</span> Logout
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      {/* ... (Main Content) ... */}

      {/* Konten Postingan */}
      <main className="max-w-7xl mx-auto p-6 lg:p-8">
        <section className="mt-8">
          <h3 className="text-2xl font-bold text-white mb-6 border-b-4 border-indigo-500 pb-2 inline-block">
            Semua Postingan ({posts.length})
          </h3>

          {posts.length === 0 ? (
            <div className="p-8 bg-gray-800 border border-dashed border-gray-700 rounded-xl text-center shadow-inner">
              <p className="text-gray-400 italic text-lg">
                Belum ada postingan yang tersedia. Mari buat postingan pertama
                Anda! ✨
              </p>
            </div>
          ) : (
            <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {posts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => router.push(`/post/${post.id}`)}
                  className="bg-gray-800 p-6 border border-gray-700 rounded-xl shadow-2xl hover:shadow-indigo-500/30 transition duration-300 transform hover:-translate-y-1 cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <h4 className="text-xl font-semibold text-white mb-3 border-l-4 border-indigo-500 pl-3">
                      {post.title}
                    </h4>
                    <p className="text-gray-400 text-sm mb-4 line-clamp-3">
                      {post.content.substring(0, 150)}
                      {post.content.length > 150 ? "..." : ""}
                    </p>

                    {/* Tanggal postingan */}
                    <p className="text-xs text-gray-500 mb-3">
                      Diposting pada{" "}
                      <span className="text-gray-400 font-medium">
                        {post.createdAt
                          ? new Date(post.createdAt).toLocaleDateString(
                              "id-ID",
                              {
                                day: "2-digit",
                                month: "long",
                                year: "numeric",
                              }
                            )
                          : "-"}
                      </span>
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 mb-3 pt-3 border-t border-gray-700">
                      <span className="font-medium text-gray-400">
                        Penulis:
                      </span>{" "}
                      {post.author.firstName} {post.author.lastName}
                    </p>

                    {/* Tags Container */}
                    <div className="flex flex-wrap gap-2 text-xs">
                      <strong className="text-gray-500">Tags:</strong>
                      {post.tags.map((tag: { id: string; name: string }) => (
                        <span
                          key={tag.id}
                          className="px-3 py-1 bg-indigo-900/50 text-indigo-300 font-medium rounded-full border border-indigo-800"
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

// Lindungi halaman dengan HOC withAuth
export default withAuth(Dashboard);
