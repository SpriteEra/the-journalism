import Link from 'next/link'
import React from 'react'

const SectionHeading = ({ headingRef, headingTitle, className = "" }) => {
    return (
        <Link
            href={headingRef || "#"}
            className={`mb-2 inline-flex items-center gap-2 text-[22px] font-semibold text-primary hover:underline ${className}`}
        >
            <span className="h-0.5 w-8.75 bg-primary" aria-hidden />
            {headingTitle}
        </Link>
    )
}

export default SectionHeading