// ImagePreview.jsx

import React, { useEffect, useState } from 'react';

const ImagePreview = ({ files }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    console.log('Number of files:', files.length);
  }, [files]);

  const handleNext = () => {
    if (currentIndex < files.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center flex-grow w-full p-4 bg-white shadow-md rounded-md">
      {files.length > 0 && (
        <img
          src={files[currentIndex]}
          alt={`preview-${currentIndex}`}
          className="w-full h-auto"
          style={{ maxWidth: '1200px', maxHeight: '1200px', objectFit: 'cover' }}
        />
      )}
      {files.length > 1 && (
        <div className="flex justify-between items-center mt-4 space-x-4">
          <button
            className="px-4 py-2 text-white bg-gray-600 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:bg-gray-300 disabled:cursor-not-allowed"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
          >
            Previous
          </button>
          <span className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md">
            Page {currentIndex + 1} of {files.length}
          </span>
          <button
            className="px-4 py-2 text-white bg-gray-800 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:bg-gray-300 disabled:cursor-not-allowed"
            onClick={handleNext}
            disabled={currentIndex === files.length - 1}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ImagePreview;
