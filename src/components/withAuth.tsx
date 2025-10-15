import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const withAuth = <P extends object>(
  WrappedComponent: React.ComponentType<P>
) => {
  const ComponentWithAuth = (props: P) => {
    const router = useRouter();
    // Tambahkan state untuk menandakan proses autentikasi sedang berjalan (di klien)
    const [isAuthChecking, setIsAuthChecking] = useState(true);

    useEffect(() => {
      // Logic token hanya berjalan di klien (di dalam useEffect)
      const token = localStorage.getItem("authToken");

      if (!token) {
        // Jika tidak ada token, redirect dan set pengecekan selesai
        router.replace("/login");
      } else {
        // Jika ada token, pengecekan selesai
        setIsAuthChecking(false);
      }
    }, [router]);

    // Tampilkan loading selama proses pengecekan token di klien
    if (isAuthChecking) {
      return <p>Memuat otentikasi...</p>;
    }

    // Setelah yakin token ada, render komponen aslinya
    return <WrappedComponent {...props} />;
  };

  return ComponentWithAuth;
};

export default withAuth;
