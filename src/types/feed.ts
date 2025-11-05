export interface FeedResponse {
  feed: {
    id: number;
    title: string;
    content: string;
    createdAt: string;
    author: {
      id: number;
      firstName: string;
      lastName: string;
    };
    tags: { id: number; name: string }[];
  }[];
}
