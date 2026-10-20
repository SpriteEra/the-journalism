// src/NewsList.js
import React, { useState } from 'react';
import { Search as BsSearch } from "lucide-react";
import { formatDate } from '../../../common/date';

const newsItems = Array.from({ length: 50 }, (_, index) => ({
  id: index + 1,
  title: "सलमान खान केस: CID करेगी आरोपी के सुसाइड की जांच, दरी से फंदा बनाकर लॉकअप के बाथरूम में लगाई थी फांसी",
  createdAt: "04:35 PM, April 11, 2024",
  reads: 15750,
  imageUrl: "https://via.placeholder.com/150",
}));

const categories = ["उत्तर प्रदेश", "मध्यप्रदेश", "छत्तीसगढ़", "बिहार", "झारखंड", "राशिफल", "देश", "क्राइम", "कैरियर", "हेल्थ", "फ़िल्म", "धर्म"];



const NewsList = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState(categories[0]);
  const itemsPerPage = 10;

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = newsItems.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.ceil(newsItems.length / itemsPerPage);

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center gap-4 mb-4">
        <div className='border-2  p-1 rounded-lg w-60 flex  justify-center items-center'>
            <input
            type="text"
            placeholder="Search News"
            className="border-none outline-none p-2"
            />
            <BsSearch   />
        </div>
        
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="border p-2 rounded"
        >
          {categories.map((category, index) => (
            <option key={index} value={category}>
              {category}
            </option>
          ))}
        </select>
        <button className="bg-blue text-paper p-2 rounded">Create New</button>
      </div>
      <p className="mb-4">{newsItems.length} Item Found</p>
      <div className="space-y-4">
        {currentItems.map((item) => (
          <div key={item.id} className="flex items-center border p-4 rounded shadow">
            <img src={item.imageUrl} alt="news" className="w-20 h-20 mr-4"/>
            <div>
                <div className="flex-1">
                <h3 className="font-medium text-xl">{item.title}</h3>
                <div className='flex justify-start gap-8'>
                    <p className="text-lg text-gray"><span className='font-semibold'>Created On:</span> {formatDate(item.createdAt)}</p>
                    <p className="text-lg text-gray"><span className='font-semibold'>Read:</span> {item.reads}</p>
                </div>
                </div>
                <div className="flex gap-4">
                <button className="bg-blue text-paper py-1 px-2 rounded-lg">Edit</button>
                <button className="bg-danger text-paper py-1 px-2 rounded-lg">Delete</button>
                </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-4">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          className="bg-gray text-paper px-4 py-2 rounded"
          disabled={currentPage === 1}
        >
          Prev
        </button>
        <span>Page {currentPage} of {totalPages}</span>
        <button
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          className="bg-blue text-paper px-4 py-2 rounded"
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default NewsList;
