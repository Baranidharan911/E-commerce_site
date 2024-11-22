import React, { useContext, useState, useEffect, useRef } from 'react';
import '../styles/DesignUploadPage.css';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { SummaryContext } from '../context/SummaryContext';
import { db, storage } from '../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import { v4 as uuidv4 } from 'uuid';

const EditUploadPage = () => {
  const { productId, cartProductId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { summaryData, updateSummaryData, loadSummaryData } = useContext(SummaryContext);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [designUrls, setDesignUrls] = useState([]);
  const [additionalInfo, setAdditionalInfo] = useState(''); // State for design_info
  const [categoryName, setCategoryName] = useState('');
  const [productSpecificationId, setProductSpecificationId] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showPopup, setShowPopup] = useState(false); // Popup visibility state
  const [fileToDelete, setFileToDelete] = useState(null); // Store file to be deleted
  const [deleteType, setDeleteType] = useState(''); // Type of file ('uploaded' or 'design')
  const fileInputRef = useRef(null);

  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    loadSummaryData();
    if (summaryData.files) {
      const reconstructedFiles = summaryData.files.map((url) => {
        const filePath = decodeURIComponent(url.split('/').slice(-1)[0].split('?')[0]);
        return { downloadURL: url, fileRefPath: filePath };
      });
      setUploadedFiles(reconstructedFiles);
    }
    if (summaryData.design_info) {
      setAdditionalInfo(summaryData.design_info); // Set from local storage if available
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const productDoc = await getDoc(doc(db, 'products', productId));
        if (productDoc.exists()) {
          const productData = productDoc.data();
          const categoryId = productData.category_id;
          const categoryDoc = await getDoc(doc(db, 'categories', categoryId));
          if (categoryDoc.exists()) {
            const categoryData = categoryDoc.data();
            setCategoryName(categoryData.category_name);
          }
        }

        const cartProductDoc = await getDoc(doc(db, 'cartProducts', cartProductId));
        if (cartProductDoc.exists()) {
          const cartProductData = cartProductDoc.data();
          const productSpecId = cartProductData.product_specification_id;
          setProductSpecificationId(productSpecId);

          const productSpecDoc = await getDoc(doc(db, 'productSpecifications', productSpecId));
          if (productSpecDoc.exists()) {
            const productSpecData = productSpecDoc.data();
            setDesignUrls(productSpecData.design_urls || []);

            // Populate the additionalInfo from Firestore's design_info field
            setAdditionalInfo(productSpecData.design_info || '');
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [productId, cartProductId]);

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (!user) {
      console.error("No user is signed in.");
      return;
    }

    setIsUploading(true); 

    const uploadPromises = files.map(async (file) => {
      const uniqueFilename = `file-${uuidv4()}`;
      const fileRef = ref(storage, `temp-files/${user.uid}/${productId}/${uniqueFilename}`);
      await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(fileRef);
      return { downloadURL, fileRefPath: fileRef.fullPath };
    });

    try {
      const fileObjects = await Promise.all(uploadPromises);
      const fileURLs = fileObjects.map((obj) => obj.downloadURL);

      const updatedFileObjects = [...uploadedFiles, ...fileObjects];
      setUploadedFiles(updatedFileObjects);
      const updatedFileURLs = [...(summaryData.files || []), ...fileURLs];
      updateSummaryData({ files: updatedFileURLs });
      localStorage.setItem('summaryData', JSON.stringify({ ...summaryData, files: updatedFileURLs }));

      console.log("Files uploaded:", updatedFileURLs);
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const confirmDelete = (fileObj, type) => {
    setFileToDelete(fileObj); 
    setDeleteType(type);
    setShowPopup(true); 
  };

  const deleteConfirmed = async () => {
    try {
      if (deleteType === 'uploaded') {
        const fileRef = ref(storage, fileToDelete.fileRefPath);
        await deleteObject(fileRef);
        const updatedFiles = uploadedFiles.filter((file) => file !== fileToDelete);
        setUploadedFiles(updatedFiles);
        const updatedFileURLs = updatedFiles.map((fileObj) => fileObj.downloadURL);
        updateSummaryData({ files: updatedFileURLs });
        localStorage.setItem('summaryData', JSON.stringify({ ...summaryData, files: updatedFileURLs }));
      } else if (deleteType === 'design') {
        const decodedUrl = decodeURIComponent(fileToDelete);
        const fileName = decodedUrl.split('/').pop().split('?')[0];
        const fileRef = ref(storage, `design-files/${user.uid}/${summaryData.product_id}/${fileName}`);
        await deleteObject(fileRef);

        const updatedDesignUrls = designUrls.filter((url) => url !== fileToDelete);
        setDesignUrls(updatedDesignUrls);
        await updateDoc(doc(db, 'productSpecifications', productSpecificationId), {
          design_urls: updatedDesignUrls,
        });
      }
      console.log('File deleted:', fileToDelete);
    } catch (error) {
      console.error('Error deleting file:', error);
    } finally {
      closePopup();
    }
  };

  const closePopup = () => {
    setShowPopup(false); 
    setFileToDelete(null); 
  };

  const handleInfoChange = (event) => {
    const info = event.target.value;
    setAdditionalInfo(info); // Update state
    updateSummaryData({ design_info: info }); // Update context
    localStorage.setItem('summaryData', JSON.stringify({ ...summaryData, design_info: info }));
  };

  const handleProceed = () => {
    if (!summaryData.product_id) {
      updateSummaryData({ product_id: productId });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    navigate(`${location.pathname.replace('uploads', 'cart-product-summary')}`);
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
            ) : (
              <div><i className="fas fa-upload"></i> Upload files</div>
            )}
          </label>
        </div>

        <div className="uploaded-images">
          {designUrls.map((url, index) => (
            <div key={index + uploadedFiles.length} className="image-preview">
              <button className="delete-button" onClick={() => confirmDelete(url, 'design')}>
                &times;
              </button>
              <img src={url} alt={`Design URL ${index + 1}`} />
            </div>
          ))}

          {uploadedFiles.map((fileObj, index) => (
            <div key={index} className="image-preview">
              <button className="delete-button" onClick={() => confirmDelete(fileObj, 'uploaded')}>
                &times;
              </button>
              <img src={fileObj.downloadURL} alt={`Uploaded ${index + 1}`} />
            </div>
          ))}
        </div>

        <textarea
          className="design-instructions"
          placeholder="Additional information"
          value={additionalInfo} // Use the additionalInfo from Firestore
          onChange={handleInfoChange}
        ></textarea>

        {showPopup && (
          <div className="popup-overlay">
            <div className="popup-content">
              <p>Are you sure you want to delete this file?</p>
              <button className="popup-confirm-btn" onClick={deleteConfirmed}>
                Yes, Delete
              </button>
              <button className="popup-cancel-btn" onClick={closePopup}>
                No, Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditUploadPage;
