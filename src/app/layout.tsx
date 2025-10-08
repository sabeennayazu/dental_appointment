import "./globals.css";
import { ReactNode } from "react";
import Navbar from "./components/navbar";



export const metadata = {
  title: "Dental Appointment System",
  description: "Book your dental checkups easily",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-black min-h-screen ">
        <Navbar />
        <main className=" bg-white">{children}</main>
      
      </body>
    </html>
  );
}
