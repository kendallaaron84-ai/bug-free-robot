import React from "react";
import "./globals.css"; // Your custom KOBA-I brand variables are here
import { ThemeProvider } from "@/components/elements/theme-provider"; // <-- Updated exact path!

export const metadata = {
  title: "KOBA-I Audio — Jubilee Dashboard",
  description: "Production Studio | Automanted Content Management Console.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased transition-colors duration-200">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
		
      </body>
    </html>
  );
}