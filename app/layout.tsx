import type { Metadata } from "next";
import Script from "next/script";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";
const siteUrl = getSiteUrl();
export const metadata: Metadata = { title: "TMF Insurance Group | Coverage Guidance", description: "Thoughtful guidance for understanding health coverage options.", ...(siteUrl ? { metadataBase: siteUrl } : {}), openGraph:{title:"TMF Insurance Group | Coverage Guidance",description:"Thoughtful guidance for understanding health coverage options.",type:"website"} };
export default function RootLayout({children}:{children:React.ReactNode}) { const ga=process.env.NEXT_PUBLIC_GA_ID; return <html lang="en"><body>{children}</body>{ga&&<><Script src={`https://www.googletagmanager.com/gtag/js?id=${ga}`} strategy="afterInteractive"/><Script id="ga-init" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)};gtag('js',new Date());gtag('config','${ga}',{send_page_view:true});`}</Script></>}</html> }
