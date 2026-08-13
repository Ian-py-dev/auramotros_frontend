import type { Metadata } from "next";
import "./globals.css";
import 'mapbox-gl/dist/mapbox-gl.css';
import { AuthProvider } from "../lib/auth-context";

export const metadata: Metadata = {
  title: "Aura",
  description: "Aura Frontend",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
