"use client";
import Image from "next/image";
import cdnLoader from "@/lib/imageLoader";

/**
 * next/image with the media-server loader. This file is a CLIENT component on purpose: the loader is a function, and a function cannot be
 * passed from a server component to next/image. Pages pass only plain props (src, alt, fill, sizes …).
 *  Same props as next/image. A missing src renders a neutral placeholder block. */
export default function Img({ src, alt = "", ...props }) {
  if (!src) return <span role="img" aria-label={alt} className={`block bg-gray-200 ${props.className || ""}`} style={props.fill ? { position: "absolute", inset: 0 } : { width: props.width, height: props.height }} />;
  return <Image loader={cdnLoader} src={src} alt={alt} {...props} />;
}
