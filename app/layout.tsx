import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
export const metadata: Metadata = { title: "Trent | Health Coverage Guidance", description: "Clear, personal help understanding health coverage options.", metadataBase: new URL("https://example.com"), openGraph:{title:"Trent | Health Coverage Guidance",description:"Clear, personal help understanding health coverage options.",type:"website"} };
export default function RootLayout({children}:{children:React.ReactNode}) { const ga=process.env.NEXT_PUBLIC_GA_ID; return <html lang="en"><body>{children}</body>{ga&&<><Script src={`https://www.googletagmanager.com/gtag/js?id=${ga}`} strategy="afterInteractive"/><Script id="ga-init" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)};gtag('js',new Date());gtag('config','${ga}',{send_page_view:true});`}</Script></>}</html> }
