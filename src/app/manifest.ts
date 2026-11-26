import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AskData",
    short_name: "AskData",
    description: "Ask questions about your business data in plain English, Urdu or Arabic.",
    start_url: "/chat",
    display: "standalone",
    background_color: "#0b0b0d",
    theme_color: "#4f46e5",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
