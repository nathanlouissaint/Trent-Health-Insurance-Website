import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { ApplicationForm } from "@/components/application-form";

export default function ApplyPage() {
  return <><Header/><main className="bg-cream"><section className="border-b border-forest/10 px-5 py-14 sm:px-8 sm:py-18 lg:px-12"><div className="mx-auto max-w-[1120px]"><p className="eyebrow">Coverage inquiry</p><h1 className="display mt-4 max-w-3xl text-5xl leading-[.92] text-forest sm:text-6xl">A clearer start to your coverage conversation.</h1><p className="mt-6 max-w-2xl leading-7 text-muted">Share a few general details so TMF Insurance Group can follow up about the coverage support you&apos;re looking for. This is an inquiry—not an insurance enrollment application.</p></div></section><section className="px-5 py-12 sm:px-8 sm:py-16 lg:px-12"><div className="mx-auto max-w-[1120px]"><ApplicationForm/></div></section></main><Footer/></>;
}
