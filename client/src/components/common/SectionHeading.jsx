import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

const SectionHeading = ({
    headingRef,
    headingTitle,
    className = "",
    noLink = false,
    showLink = false
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
        <div className='flex justify-between'>
            <Link href={headingRef || "#"} className={classes}>
                {content}
            </Link>
            {
                showLink &&
                <div className="mt-2 text-right">
                    <Link href={headingRef} className="text-sm lg:text-base font-semibold text-primary hover:underline flex items-center justify-end gap-1">
                        और पढ़ें <ChevronRight className="size-4" />
                    </Link>
                </div>
            }
        </div>
    )
}

export default SectionHeading