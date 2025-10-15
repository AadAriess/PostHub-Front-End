import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";

// Buat link HTTP
const httpLink = createHttpLink({
  uri: "http://localhost:4000/graphql",
});

// Buat link untuk menambahkan header otorisasi
const authLink = setContext((_, { headers }) => {
  // Dapatkan token dari local storage (yang disimpan setelah login/register)
  const token = localStorage.getItem("authToken");

  // Kembalikan headers sehingga Apollo Link dapat mengirimnya
  return {
    headers: {
      ...headers,
      // Jika token ada, tambahkan header Authorization
      authorization: token ? `Bearer ${token}` : "",
    },
  };
});

// Gabungkan link otorisasi dengan link HTTP
const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

export default client;
