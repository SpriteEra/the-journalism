import React from 'react'
import JsonLd from './common/JsonLd'
import SectionHeading from './common/SectionHeading'
import ArticleCard from './common/ArticleCard'
import Pagination from './common/Pagination'
import SideAds from './ads/SideAds'
import LatestNews from './LatestNews'
import { categoryPath, jsonLdList } from '@/lib/adapters'

const CategoryList = ({ jsonLd, title, items, basePath, page, hasMore }) => {
    return (
        <main className='page-container grid grid-cols-1 lg:grid-cols-7 gap-4 mt-8 lg:mt-14'>
            <JsonLd data={jsonLdList(jsonLd)} />
            <section className=' lg:col-span-5'>
                <SectionHeading
                    headingTitle={title}
                    noLink
                    className='text-2xl lg:text-3xl!'
                />
                <div className="w-full">
                    {items && items.length && items.map((item, i) => (
                        <ArticleCard key={item.id ?? i} item={item} priority={i === 0} />
                    ))}

                    <Pagination basePath={categoryPath(basePath)} page={page} hasMore={hasMore} />
                </div>
            </section>
            <section className='min-h-50  lg:col-span-2 pt-5 lg:pt-13 space-y-5 lg:space-y-3.5 relative'>
                <SideAds />
                <div className='sticky top-35'>
                    <LatestNews />
                </div>
            </section>
        </main>
    )
}

export default CategoryList