import React from 'react';

const ImagePreview = ({ files }) => {
  return (
    <div className="flex flex-col items-center justify-center flex-grow w-full p-4 bg-white shadow-md rounded-md">
      {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"> */}
      {files.map((file, index) => (
        <img
          key={index}
          src={file}
          alt={`preview-${index}`}
          className="w-full h-auto"
          style={{ maxWidth: '1200px', maxHeight: '1200px', objectFit: 'cover' }}
        />
      ))}
      {/* </div> */}
    </div>
  );
};

export default ImagePreview;
