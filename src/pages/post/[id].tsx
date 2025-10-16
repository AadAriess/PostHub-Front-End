import { gql } from "@apollo/client";
import { useQuery, useMutation } from "@apollo/client/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import {
  PostDetail,
  Comment,
  Tag,
  GetPostWithCommentsResponse,
} from "@/types/post";

// GraphQL Query untuk ambil post + komentar
const GET_POST_DETAILS = gql`
  query GetPostDetails($id: Int!) {
    getPostWithComments(id: $id) {
      id
      title
      content
      imagePath
      author {
        id
        firstName
        lastName
      }
      tags {
        id
        name
      }
      comments {
        id
        content
        parentId
        replyToUser
        createdAt
        author {
          id
          firstName
          lastName
        }
      }
    }
  }
`;

// GraphQL Query untuk komentar / balasan
const CREATE_COMMENT = gql`
  mutation CreateComment(
    $content: String!
    $authorId: Int!
    $postId: Int!
    $parentId: Int
  ) {
    createComment(
      content: $content
      authorId: $authorId
      postId: $postId
      parentId: $parentId
    ) {
      id
      content
      parentId
    }
  }
`;

function PostDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const [authorId, setAuthorId] = useState<number | null>(null);
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");

  // Ambil data user dari localStorage
  useEffect(() => {
    const profileString = localStorage.getItem("userProfile");
    if (profileString) {
      const profile = JSON.parse(profileString);
      setAuthorId(Number(profile.id));
    } else {
      router.push("/login");
    }
  }, [router]);

  // Ambil data post + komentar
  const { data, loading, error, refetch } =
    useQuery<GetPostWithCommentsResponse>(GET_POST_DETAILS, {
      variables: { id: parseInt(id as string) },
      skip: !id,
    });

  // Mutation untuk komentar / reply
  const [createComment] = useMutation(CREATE_COMMENT);

  // Kirim komentar atau balasan
  const handleReply = async (parentId: number | null = null) => {
    if (!replyContent.trim() || !authorId) return;

    try {
      await createComment({
        variables: {
          content: replyContent,
          authorId: Number(authorId),
          postId: parseInt(id as string),
          parentId: parentId ? Number(parentId) : null,
        },
      });

      setReplyContent("");
      setReplyTo(null);
      await refetch();
    } catch (err) {
      console.error("Gagal mengirim komentar:", err);
    }
  };

  // Render komentar tanpa tree, tapi tampilkan @mention
  const renderComments = (comments: Comment[]) => {
    return comments.map((comment) => (
      <div
        key={comment.id}
        className="bg-gray-800 border border-gray-700 rounded-lg p-3 mb-3"
      >
        <p className="text-gray-300">
          {comment.replyToUser && (
            <span className="text-indigo-400 mr-1">@{comment.replyToUser}</span>
          )}
          {comment.content}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Oleh:{" "}
          <span className="text-indigo-400">{comment.author.firstName}</span> •{" "}
          {new Date(comment.createdAt!).toLocaleString("id-ID")}
        </p>

        {/* Tombol Balas */}
        <button
          onClick={() =>
            setReplyTo(
              replyTo === Number(comment.id) ? null : Number(comment.id)
            )
          }
          className="text-sm text-indigo-400 hover:underline mt-2"
        >
          {replyTo === Number(comment.id) ? "Batal" : "Balas"}
        </button>

        {/* Form Reply */}
        {replyTo === Number(comment.id) && (
          <div className="mt-3">
            <textarea
              className="w-full p-2 bg-gray-900 border border-gray-700 rounded-md text-gray-200 focus:outline-none"
              rows={2}
              placeholder={`Balas ${comment.author.firstName}...`}
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
            />
            <button
              onClick={() => handleReply(Number(comment.id))}
              className="mt-2 bg-indigo-600 hover:bg-indigo-700 px-3 py-1 rounded-md text-white text-sm"
            >
              Kirim Balasan
            </button>
          </div>
        )}
      </div>
    ));
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <h1 className="text-2xl">Memuat detail postingan... ⏳</h1>
      </div>
    );

  if (error)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
        <h1 className="text-3xl text-red-500 font-bold mb-4">
          Terjadi Kesalahan 😢
        </h1>
        <p>{error.message}</p>
      </div>
    );

  const post: PostDetail | undefined = data?.getPostWithComments;

  if (!post)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <h1 className="text-2xl">Postingan tidak ditemukan ❌</h1>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 px-6 py-10">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => router.back()}
          className="text-indigo-400 hover:text-indigo-300 mb-6 inline-flex items-center gap-2"
        >
          ← Kembali
        </button>

        {/* Gambar */}
        {post.imagePath && (
          <div className="mb-8">
            <div className="w-full h-64 md:h-80 overflow-hidden rounded-xl border border-gray-700 shadow-lg">
              <img
                src={`http://localhost:4000${post.imagePath}`}
                alt={post.title}
                className="w-full h-full object-cover object-center"
              />
            </div>
          </div>
        )}

        {/* Judul & Penulis */}
        <h1 className="text-4xl font-bold text-white mb-3 border-b-4 border-indigo-500 pb-2">
          {post.title}
        </h1>
        <p className="text-gray-400 mb-4">
          Oleh:{" "}
          <span className="text-indigo-400 font-semibold">
            {post.author.firstName} {post.author.lastName}
          </span>
        </p>

        {/* Konten */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl mb-6">
          <p className="text-gray-300 leading-relaxed whitespace-pre-line">
            {post.content}
          </p>
        </div>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-10">
            {post.tags.map((tag: Tag) => (
              <span
                key={tag.id}
                className="px-3 py-1 bg-indigo-900/50 text-indigo-300 text-sm rounded-full border border-indigo-800"
              >
                #{tag.name}
              </span>
            ))}
          </div>
        )}

        {/* Komentar */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-4 border-b-2 border-indigo-500 pb-1">
            Komentar ({post.comments.length})
          </h2>

          {/* Form komentar utama */}
          <div className="mb-6">
            <textarea
              className="w-full p-3 bg-gray-900 border border-gray-700 rounded-md text-gray-200 focus:outline-none"
              rows={3}
              placeholder="Tulis komentar kamu..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
            />
            <button
              onClick={() => handleReply(null)}
              className="mt-3 bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-md text-white"
            >
              Kirim Komentar
            </button>
          </div>

          {/* Daftar komentar */}
          {post.comments.length === 0 ? (
            <p className="text-gray-500 italic">Belum ada komentar 😶</p>
          ) : (
            renderComments(post.comments)
          )}
        </section>
      </div>
    </div>
  );
}

export default PostDetailPage;
