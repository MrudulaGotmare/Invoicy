// UploadInvoice.jsx
import React, { useState } from 'react';
import Split from 'react-split';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ImagePreview from './ImagePreview';
import { Tooltip } from 'react-tooltip';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

function UploadInvoice() {
  const [files, setFiles] = useState([]);
  const [previewFiles, setPreviewFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const navigate = useNavigate();

  const handleFileChange = async (event) => {
    const selectedFiles = Array.from(event.target.files);
    setFiles(prevFiles => [...prevFiles, ...selectedFiles]);

    for (const file of selectedFiles) {
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await axios.post('http://127.0.0.1:5000/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          withCredentials: true,
        });
        console.log('Server response:', response.data);
        setPreviewFiles(prevFiles => [...prevFiles, ...response.data.files]);
      } catch (error) {
        console.error('Error uploading file:', error);
      }
    }
  };

  const handleRemove = (index) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
    setPreviewFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  const handleProcess = async () => {
    if (files.length === 0) return;
  
    setProcessing(true);
    console.log('Processing started...');
  
    try {
      const responses = await Promise.all(files.map(file => 
        axios.post('http://127.0.0.1:5000/processInvoice', { fileName: file.name }, {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true,
        })
      ));
  
      const processedData = responses.map(response => response.data);
      console.log('Processing responses:', processedData);
  
      // Extract image URLs from the processed data
      const imageUrls = processedData.flatMap(data => data.imageUrls || []);
  
      // Debugging statement before navigation
      console.log('Navigating to /invoice with data:', { invoiceData: processedData, previewFiles: imageUrls, bulkMode });
  
      navigate('/invoice', { state: { invoiceData: processedData, previewFiles: imageUrls, bulkMode } });
    } catch (error) {
      console.error('Error processing files:', error);
    } finally {
      setProcessing(false);
      console.log('Processing ended.');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <header className="w-full py-4 bg-white shadow">
        <nav className="flex justify-between items-center w-full max-w-screen-xl mx-auto">
          <div className="text-red-500 text-3xl font-bold">Xangars</div>
          <div className="flex items-center space-x-6">
            <a href="/" className="hover:text-gray-500">Home</a>
            <a href="#" className="font-bold hover:text-gray-500">Services</a>
            <a href="#" className="font-bold hover:text-gray-500">Pricing</a>
            <a href="#" className="font-bold hover:text-gray-500" onClick={() => navigate('/invoice')}>Docs</a>
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
          <main className="flex flex-col items-center justify-center flex-grow w-full p-4 bg-white shadow-md rounded-md">
            <h1 className="mb-8 text-2xl font-bold">Upload invoice</h1>
            <div className="w-full mb-4 flex justify-between items-center">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="bulk-mode"
                  checked={bulkMode}
                  onChange={() => setBulkMode(!bulkMode)}
                  className="mr-2"
                />
                <label htmlFor="bulk-mode" className="mr-2">Bulk Processing</label>
                <span 
                  data-tooltip-id="bulk-tooltip" 
                  data-tooltip-content="Enable to process multiple invoices at once"
                  className="text-blue-500 cursor-help"
                >
                  ℹ️
                </span>
                <Tooltip id="bulk-tooltip" />
              </div>
            </div>
            <div className="w-full p-4 border-2 border-dashed rounded-md border-gray-300">
              <input
                type="file"
                className="hidden"
                id="file-upload"
                accept=".pdf,image/*"
                onChange={handleFileChange}
                multiple={bulkMode}
              />
              <label
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center h-32 cursor-pointer"
              >
                <span className="text-gray-500">Drag and drop invoice file{bulkMode ? 's' : ''}</span>
                <button className="px-4 py-2 mt-4 text-white bg-gray-800 rounded-md hover:bg-gray-700" onClick={() => document.getElementById('file-upload').click()}>
                  Browse
                </button>
              </label>
            </div>
            {files.length > 0 && (
              <div className="w-full mt-4">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-100 rounded-md mb-2">
                    <div>
                      <p className="text-gray-700">{file.name}</p>
                      <p className="text-sm text-gray-500">Size: {(file.size / 1024 / 1024).toFixed(1)}MB, Type: {file.type}</p>
                    </div>
                    <button
                      className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                      onClick={() => handleRemove(index)}
                      disabled={processing}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <div className="flex justify-end mt-4">
                  <button
                    className={`px-4 py-2 text-white bg-gray-800 rounded-md hover:bg-gray-700 ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={handleProcess}
                    disabled={processing}
                  >
                    {processing ? 'Processing...' : `Process ${bulkMode ? 'All' : ''}`}
                  </button>
                </div>
              </div>
            )}
          </main>
          <ImagePreview files={previewFiles} />
        </Split>
      </div>
    </div>
  );
}

export default UploadInvoice;