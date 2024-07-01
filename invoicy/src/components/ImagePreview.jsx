//ImagePreview.jsx


import React from 'react';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import { pageNavigationPlugin } from '@react-pdf-viewer/page-navigation';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/page-navigation/lib/styles/index.css';

const ImagePreview = ({ files, selectedIndex }) => {
  const pageNavigationPluginInstance = pageNavigationPlugin();
  const { CurrentPageLabel, GoToNextPage, GoToPreviousPage } = pageNavigationPluginInstance;

  if (!files || files.length === 0 || selectedIndex === null) {
    return (
      <div className="flex flex-col items-center justify-center flex-grow w-full p-4 bg-white shadow-md rounded-md h-full">
        <p>No preview available</p>
      </div>
    );
  }

  const selectedFile = files[selectedIndex];
  const isPDF = selectedFile.endsWith('.pdf');

  return (
    <div className="flex flex-col items-center justify-between w-full h-full p-4 bg-white shadow-md rounded-md overflow-auto">
      {isPDF ? (
        <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
          <div className="flex-grow w-full h-full" style={{ maxHeight: 'calc(110vh - 100px)', overflow: 'auto' }}>
            <Viewer fileUrl={selectedFile} plugins={[pageNavigationPluginInstance]} />
          </div>
          <div className="flex justify-between items-center mt-4 space-x-4">
            <GoToPreviousPage>
              {(props) => (
                <button className="px-2 py-1 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:bg-blue-300 disabled:cursor-not-allowed"
                  disabled={props.isDisabled} onClick={props.onClick}>
                  ‹
                </button>
              )}
            </GoToPreviousPage>
            <CurrentPageLabel>
              {(props) => (
                <span className="px-2 py-1 text-sm text-gray-700 bg-gray-200 rounded-md">
                  Page {props.currentPage + 1}
                </span>
              )}
            </CurrentPageLabel>
            <GoToNextPage>
              {(props) => (
                <button className="px-2 py-1 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:bg-blue-300 disabled:cursor-not-allowed"
                  disabled={props.isDisabled} onClick={props.onClick}>
                  ›
                </button>
              )}
            </GoToNextPage>
          </div>
        </Worker>
      ) : (
        <div className="flex-grow flex items-center justify-center w-full h-full overflow-auto">
          <img src={selectedFile} alt={`preview-${selectedIndex}`} className="max-w-full max-h-full object-contain" />
        </div>
      )}
    </div>
  );
};

export default ImagePreview;