import React, { useContext, useState, useEffect, useRef } from 'react';
import '../styles/DesignUploadPage.css';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { SummaryContext } from '../context/SummaryContext';
import { db, storage } from '../firebaseConfig'; 
import { doc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import { v4 as uuidv4 } from 'uuid';
import CircularProgress from '@mui/material/CircularProgress';

const DesignUploadPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { summaryData, updateSummaryData } = useContext(SummaryContext);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [isUploading, setIsUploading] = useState(false); 
  const fileInputRef = useRef(null);

  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    const fetchCategoryName = async () => {
      try {
        const productDoc = await getDoc(doc(db, 'productData', productId));
        if (productDoc.exists()) {
          const productData = productDoc.data();
          const categoryId = productData.category_id;

          const categoryDoc = await getDoc(doc(db, 'categories', categoryId));
          if (categoryDoc.exists()) {
            const categoryData = categoryDoc.data();
            setCategoryName(categoryData.category_name);
          } else {
            console.log('No such category exists!');
          }
        } else {
          console.log('No such product exists!');
        }
      } catch (error) {
        console.error('Error fetching category name:', error);
      }
    };

    fetchCategoryName();
  }, [productId]);

  useEffect(() => {
    // Load existing files and design_info from local storage on component mount
    const storedSummaryData = JSON.parse(localStorage.getItem('summaryData'));
    const existingFiles = storedSummaryData?.files || [];
    const existingDesignInfo = storedSummaryData?.design_info || '';

    if (existingFiles.length > 0) {
      const reconstructedFiles = existingFiles.map((url) => {
        // Reconstruct the fileRef from the downloadURL
        const filePath = decodeURIComponent(url.split('/').slice(-1)[0].split('?')[0]);
        const fileRef = ref(storage, filePath);
        return { downloadURL: url, fileRef };
      });
      setUploadedFiles(reconstructedFiles);
    }

    if (existingDesignInfo) {
      setAdditionalInfo(existingDesignInfo);
    }
  }, []);

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (!user) {
      console.error("No user is signed in.");
      return;
    }

    setIsUploading(true); // Start uploading state

    const uploadPromises = files.map(async (file) => {
      const uniqueFilename = `file-${uuidv4()}`;
      const fileRef = ref(storage, `temp-files/${user.uid}/${productId}/${uniqueFilename}`);
      await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(fileRef);
      return { downloadURL, fileRef };
    });

    try {
      const fileObjects = await Promise.all(uploadPromises);
      const fileURLs = fileObjects.map((obj) => obj.downloadURL);

      // Update the state and store the URLs in context and local storage
      const updatedFileObjects = [...uploadedFiles, ...fileObjects];
      setUploadedFiles(updatedFileObjects);
      const updatedFileURLs = [...(summaryData.files || []), ...fileURLs];
      updateSummaryData({ files: updatedFileURLs });
      localStorage.setItem('summaryData', JSON.stringify({ ...summaryData, files: updatedFileURLs }));

      console.log("Files uploaded:", updatedFileURLs);
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setIsUploading(false); // End uploading state
    }
  };

  const handleDeleteFile = async (fileRef, index) => {
    try {
      await deleteObject(fileRef);
      const updatedFiles = uploadedFiles.filter((_, i) => i !== index);
      setUploadedFiles(updatedFiles);

      // Update the context and local storage
      const updatedFileURLs = updatedFiles.map((fileObj) => fileObj.downloadURL);
      updateSummaryData({ files: updatedFileURLs });
      localStorage.setItem('summaryData', JSON.stringify({ ...summaryData, files: updatedFileURLs }));

      console.log('File deleted:', fileRef);
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  const handleProceed = () => {
    if (!summaryData.product_id) {
      updateSummaryData({ product_id: productId });
    }
  
    // Clear the file input field
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  
    // Update local storage with files even if additional info is empty
    const updatedSummary = { 
      ...summaryData, 
      files: uploadedFiles.map((file) => file.downloadURL), 
      design_info: additionalInfo || "" 
    };
  
    // Store updated files and additional info (even if empty) in localStorage
    localStorage.setItem('summaryData', JSON.stringify(updatedSummary));
  
    console.log("Data stored in SummaryContext:", updatedSummary);
  
    // Check if the data is properly updated before proceeding
    if (updatedSummary.files.length > 0) {
      navigate(`${location.pathname.replace('design-upload', 'product-summary')}`);
    } else {
      console.error('No files to upload or missing data.');
    }
  };
  
  
  const handleInfoChange = (event) => {
    const info = event.target.value;
    setAdditionalInfo(info);
  
    // Update summaryData with design_info (it can be empty)
    updateSummaryData({ design_info: info });
  
    // Store it in localStorage even if it's empty
    localStorage.setItem('summaryData', JSON.stringify({ ...summaryData, design_info: info || "" }));
  };
  
  

  return (
    <div className="design-upload-page">
      <div className="design-upload-header">
        <div style={{ display: 'flex', flexDirection: 'row' }}>
          <button className="back-button" onClick={() => navigate(-1)}>
            <i className="fas fa-arrow-left"></i> 
          </button>
          <h1 className="product-title">{categoryName}</h1>
        </div>
        <button className="proceed-button" onClick={handleProceed} disabled={isUploading}>
          Save & Proceed
        </button>
      </div>
      <div className="upload-section">
        <img src="/src/assets/file-upload-icon.png" alt="Cloud Upload" className="cloud-icon" />
        <h2>Upload your files</h2>
        <p>Supported file formats: PNG, TIFF, JPG, PSD, AI, PDF, SVG, CDR, DOCX, PPTX, EPS, ZIP</p>
        <div className="input-section">
          <input
            type="file"
            id="file-upload"
            className="file-upload"
            multiple
            disabled={isUploading}
            onChange={handleFileUpload}
            ref={fileInputRef}
          />
          <label htmlFor="file-upload" className="upload-button" style={{ position: 'relative' }}>
           
            {isUploading ? (
              <p>Uploading.....</p>
            ): <div><i className="fas fa-upload"></i> Upload files </div> }
          </label>
        </div>

        {/* Display Uploaded Images with Delete Button */}
        <div className="uploaded-images">
          {uploadedFiles.map((fileObj, index) => (
            <div key={index} className="image-preview">
              <button 
                className="delete-button"
                onClick={() => handleDeleteFile(fileObj.fileRef, index)}
              >
                &times;
              </button>
              <img src={fileObj.downloadURL} alt={`Uploaded ${index + 1}`} />
            </div>
          ))}
        </div>

        <textarea
          className="design-instructions"
          placeholder="Additional information"
          value={additionalInfo}
          onChange={handleInfoChange}
        ></textarea>
      </div>
    </div>
  );
};

export default DesignUploadPage;
