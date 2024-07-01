//UploadInvoice.jsx

import React, { useState, useEffect } from 'react';
import Split from 'react-split';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ImagePreview from './ImagePreview';
import { Tooltip } from 'react-tooltip';
import xangarsLogo from '../assets/xangars_logo.png';

function UploadInvoice() {
  const [files, setFiles] = useState([]);
  const [previewFiles, setPreviewFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(null);
  const [selectedFileIndex, setSelectedFileIndex] = useState(null);
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (files.length > 0 && selectedFileIndex === null) {
      setSelectedFileIndex(0);
    }
  }, [files]);

  const checkDuplicateFiles = (newFiles) => {
    const existingFileNames = files.map(file => file.name.toLowerCase());
    const duplicates = newFiles.filter(file => existingFileNames.includes(file.name.toLowerCase()));
    return duplicates;
  };

  const handleFileChange = async (event) => {
    const selectedFiles = Array.from(event.target.files);
    const duplicates = checkDuplicateFiles(selectedFiles);

    if (duplicates.length > 0) {
      setDuplicateWarning(`Duplicate file name(s) detected: ${duplicates.map(f => f.name).join(', ')}`);
      // Remove duplicates from the selectedFiles array
      const uniqueFiles = selectedFiles.filter(file => !duplicates.some(d => d.name.toLowerCase() === file.name.toLowerCase()));
      setFiles(prevFiles => [...prevFiles, ...uniqueFiles]);
    } else {
      setDuplicateWarning(null);
      setFiles(prevFiles => [...prevFiles, ...selectedFiles]);
    }

    for (const file of selectedFiles) {
      if (!duplicates.some(d => d.name.toLowerCase() === file.name.toLowerCase())) {
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
    }
  };

  const handleRemove = (index) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
    setPreviewFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
    if (selectedFileIndex === index) {
      setSelectedFileIndex(files.length > 1 ? 0 : null);
    } else if (selectedFileIndex > index) {
      setSelectedFileIndex(selectedFileIndex - 1);
    }
    setDuplicateWarning(null);
  };

  const handleFileSelect = (index) => {
    setSelectedFileIndex(index);
  };
  // const handleRemove = (index) => {
  //   setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  //   setPreviewFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  // };

  const handleProcess = async () => {
    if (files.length === 0) return;

    setProcessing(true);
    console.log('Processing started...');

    try {
      setProcessingStep('Extracting information');
      // Simulate extraction step
      await new Promise(resolve => setTimeout(resolve, 30000));

      setProcessingStep('Collating information');
      // Simulate collation step
      await new Promise(resolve => setTimeout(resolve, 30000));

      setProcessingStep('Ready to present');
      // Actual processing
      const responses = await Promise.all(files.map(file =>
        axios.post('http://127.0.0.1:5000/processInvoice', { fileName: file.name }, {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true,
        })
      ));

      console.log("files given", previewFiles);

      const processedData = responses.map(response => response.data);
      console.log('Processing responses:', processedData);

      navigate('/invoice', { state: { invoiceData: processedData, previewFiles: previewFiles, bulkMode } });
    } catch (error) {
      console.error('Error processing files:', error);
      setProcessingStep(null);
    } finally {
      setProcessing(false);
      console.log('Processing ended.');
    }
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <header className="w-full py-4 bg-white shadow">
        <nav className="flex justify-between items-center w-full max-w-screen-xl mx-auto">
          <img src={xangarsLogo} alt="Xangars Logo" className="h-10" />
          <div className="flex items-center space-x-6">
            <a href="/" className="hover:text-gray-500">Home</a>
            <a href="#" className="font-bold hover:text-gray-500">Services</a>
            <a href="#" className="font-bold hover:text-gray-500">Pricing</a>
            <a href="#" className="font-bold hover:text-gray-500">Docs</a>
            <a href="#" className="font-bold hover:text-gray-500">Contact Sales</a>
          </div>
        </nav>
      </header>
      <div className="flex flex-grow w-full h-full py-4 rounded-md">
        <Split className="flex flex-grow" sizes={[50, 50]} minSize={100} expandToMin={false} gutterSize={8} gutterAlign="center" snapOffset={30} dragInterval={1} direction="horizontal" cursor="ew-resize">
          <main className="flex flex-col items-center justify-center flex-grow w-full p-4 bg-white shadow-md rounded-md">
            <h1 className="mb-8 text-2xl font-bold">Get started by uploading your invoices below</h1>
            <div className="w-full p-4 border-2 border-dashed rounded-md border-gray-300">
              <input type="file" className="hidden" id="file-upload" accept=".pdf,image/*" onChange={handleFileChange} multiple />
              <label htmlFor="file-upload" className="flex flex-col items-center justify-center h-32 cursor-pointer">
                <span className="text-gray-500">Drag and drop invoice files</span>
                <button className="px-4 py-2 mt-4 text-white bg-gray-800 rounded-md hover:bg-gray-700"
                  onClick={() => document.getElementById('file-upload').click()}>
                  Browse
                </button>
              </label>
            </div>
            {duplicateWarning && (
              <div className="w-full mt-4 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700">
                <p>{duplicateWarning}</p>
              </div>
            )}
            {files.length > 0 && (
              <div className="w-full mt-4">
                {files.map((file, index) => (
                  <div key={index} className={`flex items-center justify-between p-4 rounded-md mb-2 ${selectedFileIndex === index ? 'bg-blue-100' : 'bg-gray-100'}`}>
                    <div className="cursor-pointer" onClick={() => handleFileSelect(index)}>
                      <p className="text-gray-700">{file.name}</p>
                      <p className="text-sm text-gray-500">Size: {(file.size / 1024 / 1024).toFixed(1)}MB, Type: {file.type}</p>
                    </div>
                    <button className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                      onClick={() => handleRemove(index)} disabled={processing}>
                      Remove
                    </button>
                  </div>
                ))}
                <div className="flex justify-end mt-4">
                  {!processing && (
                    <button className={`px-4 py-2 text-white bg-gray-800 rounded-md hover:bg-gray-700 ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={handleProcess} disabled={processing}>
                      {processing ? 'Processing...' : 'Process All'}
                    </button>
                  )}
                </div>
                {processing && (
                  <div className="mt-4 text-center">
                    <p className="text-lg font-semibold">{processingStep}</p>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-gray-800 h-2.5 rounded-full transition-all duration-500 ease-out"
                        style={{
                          width:
                            processingStep === 'Extracting information' ? '33%' :
                              processingStep === 'Collating information' ? '66%' :
                                processingStep === 'Ready to present' ? '100%' : '0%'
                        }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </main>
          <ImagePreview files={previewFiles} selectedIndex={selectedFileIndex} />
        </Split>
      </div>
    </div>
  );
}

export default UploadInvoice;