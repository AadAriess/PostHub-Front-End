import { gql } from "@apollo/client";
import { useQuery, useMutation } from "@apollo/client/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import io from "socket.io-client";
import {
  PostDetail,
  Comment,
  Tag,
  GetPostWithCommentsResponse,
} from "@/types/post";

const socket = io("http://localhost:4000", { transports: ["websocket"] });

// GraphQL query untuk mengambil detail post beserta komentarnya
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

// GraphQL mutation untuk membuat komentar
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

// GraphQL mutation untuk mengupdate komentar
const UPDATE_COMMENT = gql`
  mutation UpdateComment($commentId: Int!, $content: String!) {
    updateComment(commentId: $commentId, content: $content) {
      id
      content
      status
    }
  }
`;

// GraphQL mutation untuk menghapus komentar
const DELETE_COMMENT = gql`
  mutation DeleteComment($commentId: Int!) {
    deleteComment(commentId: $commentId)
  }
`;

export default function PostDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const [authorId, setAuthorId] = useState<number | null>(null);
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyContents, setReplyContents] = useState<{ [key: number]: string }>(
    {}
  );
  const [comments, setComments] = useState<Comment[]>([]);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");

  const { data, loading, error } = useQuery<GetPostWithCommentsResponse>(
    GET_POST_DETAILS,
    {
      variables: { id: parseInt(id as string) },
      skip: !id,
    }
  );

  const [createComment] = useMutation(CREATE_COMMENT);
  const [updateComment] = useMutation(UPDATE_COMMENT);
  const [deleteComment] = useMutation(DELETE_COMMENT);

  // Ambil authorId dari localStorage
  useEffect(() => {
    const profileString = localStorage.getItem("userProfile");
    if (profileString) {
      const profile = JSON.parse(profileString);
      setAuthorId(Number(profile.id));
    } else {
      router.push("/login");
    }
  }, [router]);

  // Set komentar awal dari data query
  useEffect(() => {
    if (data?.getPostWithComments?.comments) {
      setComments(data.getPostWithComments.comments);
    }
  }, [data]);

  // Socket.IO listener (real-time comment update)
  useEffect(() => {
    if (!id) return;

    socket.on("comment:new", (newComment: Comment) => {
      setComments((prev) => [
        ...prev,
        { ...newComment, createdAt: new Date(newComment.createdAt) },
      ]);
    });

    socket.on("comment:update", (updated: Comment) => {
      setComments((prev) =>
        prev.map((c) =>
          c.id === updated.id
            ? { ...c, ...updated, createdAt: new Date(updated.createdAt) }
            : c
        )
      );
    });

    socket.on("comment:delete", (deleted: { id: number }) => {
      setComments((prev) => prev.filter((c) => c.id !== deleted.id));
    });

    return () => {
      socket.off("comment:new");
      socket.off("comment:update");
      socket.off("comment:delete");
    };
  }, [id]);

  // Handle kirim komentar / balasan
  const handleReply = async (parentId: number | null = null) => {
    if (!parentId && !replyContents[0]?.trim()) return; // komentar utama
    const content = parentId ? replyContents[parentId] : replyContents[0];
    if (!content?.trim() || !authorId) return;

    try {
      await createComment({
        variables: {
          content,
          authorId,
          postId: Number(id),
          parentId: parentId !== null ? Number(parentId) : null,
        },
      });

      // reset hanya untuk komentar yang dikirim
      setReplyContents((prev) => {
        const newState = { ...prev };
        if (parentId) {
          newState[parentId] = "";
        } else {
          newState[0] = "";
        }
        return newState;
      });
      setReplyTo(null);
    } catch (err) {
      console.error("Gagal kirim komentar:", err);
    }
  };

  // Handle edit komentar
  const handleUpdate = async (commentId: number, content: string) => {
    try {
      await updateComment({
        variables: { commentId: Number(commentId), content },
      });
      setEditingCommentId(null);
      setEditContent("");
    } catch (err) {
      console.error("Gagal update komentar:", err);
    }
  };

  // Handle hapus komentar
  const handleDelete = async (commentId: number) => {
    if (!confirm("Yakin hapus komentar ini?")) return;
    try {
      await deleteComment({ variables: { commentId: Number(commentId) } });
    } catch (err) {
      console.error("Gagal hapus komentar:", err);
    }
  };

  // Render setiap komentar
  const renderComments = (comments: Comment[]) => {
    return comments.map((comment) => {
      const isMine = comment.author?.id
        ? Number(comment.author.id) === Number(authorId)
        : false;

      return (
        <div
          key={comment.id}
          className="bg-gray-800 border border-gray-700 rounded-lg p-3 mb-3"
        >
          {editingCommentId === comment.id ? (
            <div>
              <textarea
                className="w-full p-2 bg-gray-900 border border-gray-700 rounded-md text-gray-200"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
              />
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => handleUpdate(comment.id, editContent)}
                  className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-white text-sm"
                >
                  Simpan
                </button>
                <button
                  onClick={() => setEditingCommentId(null)}
                  className="bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded text-white text-sm"
                >
                  Batal
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-gray-300">
                {comment.replyToUser && (
                  <span className="text-indigo-400 mr-1">
                    @{comment.replyToUser}
                  </span>
                )}
                {comment.content}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Oleh{" "}
                <span className="text-indigo-400">
                  {comment.author?.firstName ?? "Anonim"}
                </span>{" "}
                • {new Date(comment.createdAt).toLocaleString("id-ID")}
              </p>

              <div className="mt-2 flex gap-3">
                <button
                  onClick={() =>
                    setReplyTo(replyTo === comment.id ? null : comment.id)
                  }
                  className="text-sm text-indigo-400 hover:underline"
                >
                  {replyTo === comment.id ? "Batal" : "Balas"}
                </button>

                {isMine && (
                  <>
                    <button
                      onClick={() => {
                        setEditingCommentId(comment.id);
                        setEditContent(comment.content);
                      }}
                      className="text-sm text-yellow-400 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="text-sm text-red-400 hover:underline"
                    >
                      Hapus
                    </button>
                  </>
                )}
              </div>

              {replyTo === comment.id && (
                <div className="mt-3">
                  <textarea
                    className="w-full p-2 bg-gray-900 border border-gray-700 rounded-md text-gray-200"
                    rows={2}
                    placeholder={`Balas ${comment.author.firstName}...`}
                    value={replyContents[comment.id] || ""}
                    onChange={(e) =>
                      setReplyContents((prev) => ({
                        ...prev,
                        [comment.id]: e.target.value,
                      }))
                    }
                  />
                  <button
                    onClick={() => handleReply(comment.id)}
                    className="mt-2 bg-indigo-600 hover:bg-indigo-700 px-3 py-1 rounded-md text-white text-sm"
                  >
                    Kirim Balasan
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      );
    });
  };

  // UI utama
  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen text-white">
        Memuat detail postingan...
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen text-red-500">
        {error.message}
      </div>
    );

  const post: PostDetail | undefined = data?.getPostWithComments;

  if (!post)
    return (
      <div className="flex items-center justify-center min-h-screen text-white">
        Postingan tidak ditemukan
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

        {post.imagePath && (
          <div className="mb-8">
            <img
              src={`http://localhost:4000${post.imagePath}`}
              alt={post.title}
              className="w-full h-72 object-cover rounded-lg border border-gray-700"
            />
          </div>
        )}

        <h1 className="text-4xl font-bold mb-2">{post.title}</h1>
        <p className="text-gray-400 mb-6">
          Oleh{" "}
          <span className="text-indigo-400">
            {post.author.firstName} {post.author.lastName}
          </span>
        </p>

        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 mb-6">
          <p className="whitespace-pre-line">{post.content}</p>
        </div>

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

        {/* KOMENTAR */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-4 border-b-2 border-indigo-500 pb-1">
            Komentar ({comments.length})
          </h2>

          <div className="mb-6">
            <textarea
              className="w-full p-3 bg-gray-900 border border-gray-700 rounded-md text-gray-200 focus:outline-none"
              rows={3}
              placeholder="Tulis komentar kamu..."
              value={replyContents[0] || ""}
              onChange={(e) =>
                setReplyContents((prev) => ({ ...prev, 0: e.target.value }))
              }
            />
            <button
              onClick={() => handleReply(null)}
              className="mt-3 bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-md text-white"
            >
              Kirim Komentar
            </button>
          </div>

          {comments.length === 0 ? (
            <p className="text-gray-500 italic">Belum ada komentar 😶</p>
          ) : (
            renderComments(comments)
          )}
        </section>
      </div>
    </div>
  );
}
