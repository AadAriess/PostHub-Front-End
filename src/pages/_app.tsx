import { ApolloProvider } from "@apollo/client/react";
import type { AppProps } from "next/app";
import client from "../utils/apollo-client";
import "../styles/globals.css";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ApolloProvider client={client}>
      <Component {...pageProps} />
    </ApolloProvider>
  );
}

export default MyApp;
