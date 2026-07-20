import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter=Inter({subsets:["latin"]});
export const metadata:Metadata={title:"Reward Farm Operations",description:"Internal Reward Farm administration"};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body className={inter.className}>{children}</body></html>}
