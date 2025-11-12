import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

const SocketContext = createContext<Socket | null>(null);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  // Inisialisasi koneksi Socket.IO
  useEffect(() => {
    const newSocket = io("http://localhost:4000", {
      transports: ["websocket"],
    });
    setSocket(newSocket);

    newSocket.on("connect", () =>
      console.log("✅ Connected to WebSocket server:", newSocket.id)
    );

    return () => {
      newSocket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
