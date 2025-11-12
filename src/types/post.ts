// Tipe untuk entitas Author
export interface Author {
  id: string;
  firstName: string;
  lastName: string;
}

// Tipe untuk entitas Tag
export interface Tag {
  id: string;
  name: string;
}

// Tipe untuk entitas Comment
export interface Comment {
  id: number;
  content: string;
  parentId?: number | null;
  replyToUser?: string | null;
  createdAt: Date;
  author: Author;
  replies?: Comment[];
  postId?: number;
}

// Tipe untuk entitas Post
export interface Post {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  author: Author;
  tags: Tag[];
  imagePath?: string | null;
}

// Tipe untuk entitas Comment
export interface PostDetail extends Post {
  comments: Comment[];
  updatedAt?: string;
}

// Tipe untuk respons query getAllPosts
export interface GetAllPostsResponse {
  getAllPosts: Post[];
}

// Tipe untuk entitas Comment
export interface GetPostWithCommentsResponse {
  getPostWithComments: PostDetail;
}

export interface FilterPostsResponse {
  filterPosts: Post[];
}
