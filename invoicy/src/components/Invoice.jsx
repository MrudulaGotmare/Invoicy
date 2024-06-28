import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Split from 'react-split';
import UIOutput from './UIOutput';
import JSONOutput from './JSONOutput';
import ImagePreview from './ImagePreview';
import ScrollIndicator from './ScrollIndicator'; // Import the new component
import xangarsLogo from '../assets/xangars_logo.png';

function Invoice() {
  const [view, setView] = useState('JSON');
  const location = useLocation();
  const invoiceData = location.state?.invoiceData || [];
  const previewFiles = location.state?.previewFiles || [];

  // State to hold the file extension
  const [fileExtension, setFileExtension] = useState('');

  useEffect(() => {
    // Function to extract file extension from URL
    const getFileExtension = (url) => {
      const lastDotIndex = url.lastIndexOf('.');
      if (lastDotIndex === -1) return ''; // No extension found
      return url.slice(lastDotIndex + 1);
    };

    // Extract file extension from the first preview file URL
    if (previewFiles.length > 0) {
      const firstPreviewFile = previewFiles[0];
      const extension = getFileExtension(firstPreviewFile);
      setFileExtension(extension.toLowerCase()); // Ensure extension is lower case for consistency
    }
  }, [previewFiles]);

  // Determine if the file is PDF or single image based on file extension
  console.log(fileExtension);
  const isPDF = fileExtension === 'pdf';
  const isSingleImage = fileExtension === 'jpg' || fileExtension === 'jpeg' || fileExtension === 'png';

  // Extract and parse the structured data based on file type
  const structuredData = invoiceData.map(data => {
    let parsedData = {};
    if (isPDF && data.structured_data && data.structured_data.response_content) {
      try {
        parsedData = JSON.parse(data.structured_data.response_content);
      } catch (error) {
        console.error('Error parsing structured data:', error);
      }
    } else if (isSingleImage && data && data.response_content) {
      try {
        parsedData = JSON.parse(data.response_content);
      } catch (error) {
        console.error('Error parsing structured data:', error);
      }
    }
    return {
      ...parsedData,
      token_usage: data?.token_usage || {},
      avg_confidence: data.avg_confidence || 0,
      total_cost_inr: data.total_cost_inr || 0 // Add total_cost_inr here
    };
  });

  // Log the structured data for debugging purposes
  console.log("structured data is:", structuredData);

  // Log the invoiceData and previewFiles to ensure they have the expected values
  console.log('Invoice Data:', invoiceData);
  console.log('Preview Files:', previewFiles);

  return (
    <div className="min-h-screen bg-gray-100">
      <header>
        <nav className="flex justify-between items-center w-full max-w-6xl mx-auto">
          <img src={xangarsLogo} alt="Xangars Logo" className="h-10" />
          <div className="flex items-center space-x-6">
            <a href="/" className="font-bold hover:text-gray-500">Home</a>
            <a href="#" className="font-bold hover:text-gray-500">Services</a>
            <a href="#" className="font-bold hover:text-gray-500">Pricing</a>
            <a href="#" className="hover:text-gray-500">Docs</a>
            <a href="#" className="font-bold hover:text-gray-500">Contact Sales</a>
          </div>
        </nav>
      </header>
      <div className="flex flex-grow w-full h-full py-4 rounded-md">
        <Split
          className="flex flex-grow relative" // Add 'relative' class here
          sizes={[50, 50]}
          minSize={100}
          expandToMin={false}
          gutterSize={8}
          gutterAlign="center"
          snapOffset={30}
          dragInterval={1}
          direction="horizontal"
          cursor="ew-resize"
        >
          <div className="flex flex-col items-center justify-center flex-grow w-full p-4 bg-white shadow-md rounded-md">
            <div className="flex justify-between w-full mb-8">
              <h1 className="text-3xl font-bold">{invoiceData.length > 0 ? invoiceData[0].file_name : 'Invoice'}</h1>
              <div className="flex space-x-4">
                <button
                  className={`px-4 py-2 text-gray-700 rounded-md flex items-center ${view === 'UI' ? 'bg-gray-300' : 'bg-gray-100 hover:bg-gray-300'}`}
                  onClick={() => setView('UI')}
                >
                  UI
                </button>
                <button
                  className={`px-4 py-2 text-gray-700 rounded-md flex items-center ${view === 'JSON' ? 'bg-gray-300' : 'bg-gray-100 hover:bg-gray-300'}`}
                  onClick={() => setView('JSON')}
                >
                  JSON
                </button>
              </div>
            </div>
            {view === 'UI' ? <UIOutput invoiceData={structuredData} /> : <JSONOutput structuredData={structuredData} />}
          </div>
          <ImagePreview files={previewFiles} />
          <ScrollIndicator /> {/* Add the ScrollIndicator component here */}
        </Split>
      </div>
    </div>
  );
}

export default Invoice;