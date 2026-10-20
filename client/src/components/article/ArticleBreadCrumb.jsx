import Link from 'next/link'
import React from 'react'

const ArticleBreadCrumb = ({ breadcrumb, title }) => {
    return (
        <nav aria-label="breadcrumb" className="mb-3 flex items-center overflow-hidden text-sm lg:text-[15px] leading-normal overflow-x-auto no-scrollbar">
            {breadcrumb.map((crumb) => (
                <span key={crumb.href} className="flex shrink-0 items-center">
                    <Link href={crumb.href} className="font-semibold text-black hover:text-primary">
                        {crumb.label}
                    </Link>
                    <span className="mx-2 h-3.5 w-px bg-black/30" aria-hidden />
                </span>
            ))}
            <span className="text-black/75 whitespace-nowrap">{title}</span>
        </nav>
    )
}

export default ArticleBreadCrumb