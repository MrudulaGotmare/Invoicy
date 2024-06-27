import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Split from 'react-split';
import UIOutput from './UIOutput';
import JSONOutput from './JSONOutput';
import ImagePreview from './ImagePreview';

function Invoice() {
  const [view, setView] = useState('JSON');
  const location = useLocation();
  const invoiceData = location.state?.invoiceData || {};
  const previewFiles = location.state?.previewFiles;

  // Log the invoiceData to ensure it has the expected values
  console.log('Invoice Data:', invoiceData);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="w-full py-4 bg-white shadow">
        <nav className="flex justify-between items-center w-full max-w-6xl mx-auto">
          <div className="text-red-500 text-3xl font-bold">Xangars</div>
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
          className="flex flex-grow"
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
              <h1 className="text-3xl font-bold">{invoiceData.file_name}</h1>
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
            {view === 'UI' ? <UIOutput invoiceData={invoiceData} /> : <JSONOutput invoiceData={invoiceData} />}
          </div>
          <ImagePreview files={previewFiles} />
        </Split>
      </div>
    </div>
  );
}

export default Invoice;
