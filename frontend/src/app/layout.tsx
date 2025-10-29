import "./globals.css";
import { ReactNode } from "react";
import Navbar from "./components/navbar";
import Footer from "./components/footer";



export const metadata = {
  title: "Dental Appointment System",
  description: "Book your dental checkups easily",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body className="bg-white text-black min-h-screen overflow-x-hidden flex flex-col">
        <Navbar />
        <main className="bg-white w-full max-w-[100vw] overflow-x-hidden min-h-0 flex-grow">
          {children}
        </main>
        <Footer/>
      </body>
    </html>
  );
}
