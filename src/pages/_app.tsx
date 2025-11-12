import { ApolloProvider } from "@apollo/client/react";
import type { AppProps } from "next/app";
import client from "../utils/apollo-client";
import "../styles/globals.css";
import { SocketProvider } from "../context/socketContext";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ApolloProvider client={client}>
      <SocketProvider>
        <Component {...pageProps} />
      </SocketProvider>
    </ApolloProvider>
  );
}

export default MyApp;
