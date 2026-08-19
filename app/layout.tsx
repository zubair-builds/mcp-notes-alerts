import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MCP MVP",
  description: "Personal MCP server: notes, alerts, and a call-log dashboard.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0, background: "#0b0d12", color: "#e6e8eb" }}>
        {children}
      </body>
    </html>
  );
}
