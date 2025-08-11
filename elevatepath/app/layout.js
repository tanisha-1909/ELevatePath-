import { Inter} from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ClerkProvider } from "@clerk/nextjs";
import Header from "@/components/Header";

const inter= Inter({subsets:["latin"]});


export const metadata = {
  title: "ElevatePath- AI Career Coach",
  description: "Smarter Steps to Your Dream Career",
};

export default function RootLayout({ children }) {
  const defaultThemeClass = "dark";
  const defaultColorScheme = "dark";

  return (
    <ClerkProvider>
      <html
      lang="en"
      suppressHydrationWarning
    >
      <body
        className={` ${inter.className} `}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {/*header */}
          <Header/>
          <main className="min-h-screen">{children}</main>
          {/*footer */}
          <footer className="bg-muted/50 py-12">
            <div className="container mx-auto px-4 text-center text-gray-200">
              <p>Made With Love By Tanisha Mahavar</p>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
    </ClerkProvider>
  );
}
