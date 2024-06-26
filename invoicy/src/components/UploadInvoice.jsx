// UploadInvoice.jsx

import React, { useState } from 'react';
import Split from 'react-split';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ImagePreview from './ImagePreview';

function UploadInvoice() {
  const [file, setFile] = useState(null);
  const [previewFiles, setPreviewFiles] = useState([]);
  const navigate = useNavigate();

  const handleFileChange = async (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await axios.post('http://127.0.0.1:5000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        withCredentials: true,
      });
      setPreviewFiles(response.data.files);
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const handleRemove = () => {
    setFile(null);
    setPreviewFiles([]);
  };

  const handleProcess = () => {
    alert('Processing file: ' + file.name);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <header className="w-full py-4 bg-white shadow">
        <nav className="flex justify-between items-center w-full max-w-screen-xl mx-auto">
          <div className="text-red-500 text-3xl font-bold">Xangars</div>
          <div className="flex items-center space-x-6">
            <a href="/" className=" hover:text-gray-500">Home</a>
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
            <div className="w-full p-4 border-2 border-dashed rounded-md border-gray-300">
              <input
                type="file"
                className="hidden"
                id="file-upload"
                accept=".pdf,image/*"
                onChange={handleFileChange}
              />
              <label
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center h-32 cursor-pointer"
              >
                <span className="text-gray-500">Drag and drop invoice file</span>
                <button className="px-4 py-2 mt-4 text-white bg-gray-800 rounded-md hover:bg-gray-700" onClick={() => document.getElementById('file-upload').click()}>
                  Browse</button>
              </label>
            </div>
            {file && (
              <div className="w-full mt-4">
                <div className="flex items-center justify-between p-4 bg-gray-100 rounded-md">
                  <div>
                    <p className="text-gray-700">{file.name}</p>
                    <p className="text-sm text-gray-500">Size: {(file.size / 1024 / 1024).toFixed(1)}MB, Type: {file.type}</p>
                  </div>
                  <div className="flex space-x-4">
                    <button
                      className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                      onClick={handleRemove}
                    >
                      Remove
                    </button>
                    <button
                      className="px-4 py-2 text-white bg-gray-800 rounded-md hover:bg-gray-700"
                      onClick={handleProcess}
                    >
                      Process
                    </button>
                  </div>
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
