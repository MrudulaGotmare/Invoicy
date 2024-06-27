import React, { useState } from 'react';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import { pageNavigationPlugin } from '@react-pdf-viewer/page-navigation';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/page-navigation/lib/styles/index.css';

const ImagePreview = ({ files }) => {
  // console.log('Files received in ImagePreview:', files);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [numPages, setNumPages] = useState(1);

  const pageNavigationPluginInstance = pageNavigationPlugin();
  const { CurrentPageLabel, GoToNextPage, GoToPreviousPage } = pageNavigationPluginInstance;

  if (!files || files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-grow w-full p-4 bg-white shadow-md rounded-md">
        <p>No preview available</p>
      </div>
    );
  }

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

  const isPDF = files[currentIndex].endsWith('.pdf');

  return (
    <div className="flex flex-col items-center justify-center flex-grow w-full p-4 bg-white shadow-md rounded-md">
      {isPDF ? (
        <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
          <div className="w-full h-full" style={{ height: '600px', overflowX: 'auto', overflowY: 'hidden' }}>
            <Viewer
              fileUrl={files[currentIndex]}
              plugins={[pageNavigationPluginInstance]}
              onDocumentLoad={(e) => setNumPages(e.doc.numPages)}
            />
          </div>
          <div className="flex justify-between items-center mt-4 space-x-4">
            <GoToPreviousPage>
              {(props) => (
                <button
                  className="px-2 py-1 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:bg-blue-300 disabled:cursor-not-allowed"
                  disabled={props.isDisabled}
                  onClick={props.onClick}
                >
                  ‹
                </button>
              )}
            </GoToPreviousPage>
            <CurrentPageLabel>
              {(props) => (
                <span className="px-2 py-1 text-sm text-gray-700 bg-gray-200 rounded-md">
                  Page {props.currentPage + 1} of {numPages}
                </span>
              )}
            </CurrentPageLabel>
            <GoToNextPage>
              {(props) => (
                <button
                  className="px-2 py-1 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:bg-blue-300 disabled:cursor-not-allowed"
                  disabled={props.isDisabled}
                  onClick={props.onClick}
                >
                  ›
                </button>
              )}
            </GoToNextPage>
          </div>
        </Worker>
      ) : (
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
            Previous File
          </button>
          <span className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md">
            File {currentIndex + 1} of {files.length}
          </span>
          <button
            className="px-4 py-2 text-white bg-gray-800 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:bg-gray-300 disabled:cursor-not-allowed"
            onClick={handleNext}
            disabled={currentIndex === files.length - 1}
          >
            Next File
          </button>
        </div>
      )}
    </div>
  );
};

export default ImagePreview;
