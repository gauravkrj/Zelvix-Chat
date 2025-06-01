//layout.js
import "./globals.css";

export const metadata = {
  title: "AI Chatbot",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-dark text-light">{children}</body>
    </html>
  );
}