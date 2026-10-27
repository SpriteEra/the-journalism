import Link from 'next/link'
import React from 'react'

const SectionHeading = ({
    headingRef,
    headingTitle,
    className = "",
    noLink = false,
}) => {
    const classes = `mb-2 inline-flex items-center gap-2 text-[22px] font-semibold text-primary ${noLink ? "" : "hover:underline"
        } ${className}`

    const content = (
        <>
            <span className="h-0.5 w-8.75 bg-primary" aria-hidden />
            {headingTitle}
        </>
    )

    if (noLink) {
        return <div className={classes}>{content}</div>
    }

    return (
        <Link href={headingRef || "#"} className={classes}>
            {content}
        </Link>
    )
}

export default SectionHeading