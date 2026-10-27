"use client";
export function track(event:string) { if (typeof window !== "undefined" && "gtag" in window) (window as unknown as {gtag:(...a:unknown[])=>void}).gtag("event",event); }
