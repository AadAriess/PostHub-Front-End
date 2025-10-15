// Tipe untuk entitas Author
interface Author {
  id: string;
  firstName: string;
  lastName: string;
}

// Tipe untuk entitas Tag
interface Tag {
  id: string;
  name: string;
}

// Tipe untuk entitas Post
export interface Post {
  id: string;
  title: string;
  content: string;
  author: Author;
  tags: Tag[];
}

// Tipe untuk respons query getAllPosts
export interface GetAllPostsResponse {
  getAllPosts: Post[];
}
