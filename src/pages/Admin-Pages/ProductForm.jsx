import React, { useState, useEffect } from "react";
import { collection, setDoc, getDocs, doc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../firebaseConfig";
import { v4 as uuidv4 } from 'uuid';
import './ProductForm.css'; 
import { productParametersPrototype } from "../../components/Utils";

const ProductForm = () => {
  const [productName, setProductName] = useState("");
  const [price, setPrice] = useState("");
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedCategoryName, setSelectedCategoryName] = useState("");
  
  // State for product description
  const [description, setDescription] = useState("");

  // State for product images
  const [productImages, setProductImages] = useState([{ file: null }]); // Array of objects for each file input

  // State for product requirements
  const [productParameters, setProductParameters] = useState({});
  const [productRequirements, setProductRequirements] = useState(
    productParametersPrototype
  );

  // State for dropdown sections
  const [openSections, setOpenSections] = useState({});

  // States for Overview, Options, and Designs (multiple entries)
  const [overviews, setOverviews] = useState([{ title: "", text: "", image: null }]);
  const [options, setOptions] = useState([{ title: "", text: "", image: null }]);
  const [designs, setDesigns] = useState([{ title: "", text: "", image: null }]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "categories"));
        const categoryList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCategories(categoryList);
      } catch (error) {
        console.error("Error fetching categories: ", error);
      }
    };

    const fetchProductParameters = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "productParameters"));
        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0]; // Assuming there's only one document
          setProductParameters(doc.data());
        } else {
          console.error("No documents found in ProductParameters collection.");
        }
      } catch (error) {
        console.error("Error fetching product parameters: ", error);
      }
    };

    fetchCategories();
    fetchProductParameters();
  }, []);

  const handleCategoryChange = (e) => {
    const selectedCategoryId = e.target.value;
    const selectedCategory = categories.find(
      (category) => category.id === selectedCategoryId
    );
    setSelectedCategoryId(selectedCategoryId);
    setSelectedCategoryName(selectedCategory?.category_name || "");
  };

  const handleImageChange = (index, e) => {
    const newProductImages = [...productImages];
    newProductImages[index].file = e.target.files[0];
    setProductImages(newProductImages);
  };

  const addImageField = () => {
    setProductImages([...productImages, { file: null }]);
  };

  const removeImageField = (index) => {
    const newProductImages = productImages.filter((_, i) => i !== index);
    setProductImages(newProductImages);
  };

  const handleCheckboxChange = (e, field) => {
    const { value, checked } = e.target;

    setProductRequirements(prev => {
      let newValues = [];
      if (checked) {
        newValues = [...prev[field], value];
      } else {
        newValues = prev[field].filter(item => item !== value);
      }

      // Handle "No Data" case
      if (value === "null") {
        newValues = checked ? [] : prev[field];
      } else {
        newValues = newValues.filter(item => item !== "null");
      }
      return {
        ...prev,
        [field]: field === 'quantity' ? newValues.map(Number) : newValues // Convert quantity to numbers
      };
    });
  };

  const handleDropdownToggle = (section) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleOverviewChange = (index, field, value) => {
    const newOverviews = [...overviews];
    newOverviews[index][field] = value;
    setOverviews(newOverviews);
  };

  const handleOptionsChange = (index, field, value) => {
    const newOptions = [...options];
    newOptions[index][field] = value;
    setOptions(newOptions);
  };

  const handleDesignsChange = (index, field, value) => {
    const newDesigns = [...designs];
    newDesigns[index][field] = value;
    setDesigns(newDesigns);
  };

  const addOverviewField = () => {
    setOverviews([...overviews, { title: "", text: "", image: null }]);
  };

  const addOptionsField = () => {
    setOptions([...options, { title: "", text: "", image: null }]);
  };

  const addDesignsField = () => {
    setDesigns([...designs, { title: "", text: "", image: null }]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      // Step 1: Upload images to Firebase Storage and get URLs
      const imageUrls = await Promise.all(
        productImages.map(async (imageObj) => {
          if (imageObj.file) {
            const uniqueFileName = `${uuidv4()}-${imageObj.file.name}`; // Generate a unique file name
            const imageRef = ref(
              storage,
              `${selectedCategoryName}/${productName}/${uniqueFileName}`
            );
            const uploadTask = await uploadBytesResumable(imageRef, imageObj.file);
            const downloadUrl = await getDownloadURL(uploadTask.ref);
            return downloadUrl;
          }
          return null;
        })
      ).then((urls) => urls.filter((url) => url !== null)); // Filter out any null values
  
      // Step 2: Add product with reference to the description and image URLs
      const descriptionId = productName.toLowerCase().replace(/\s+/g, '-');
      await setDoc(doc(db, "products", descriptionId), {
        product_name: productName,
        price: parseFloat(price),
        category_id: selectedCategoryId,
        description_id: descriptionId, // Include description_id here
        product_images: imageUrls, // array of image URLs
      });
  
      // Step 3: Add product requirements linked to the product
      await setDoc(doc(db, "productRequirements", descriptionId), {
        product_id: descriptionId,
        ...productRequirements,
        productRequirementId: descriptionId // Linking requirement to product
      });

      // Step 4: Upload Overview, Options, Designs (images + text + title)
      const uploadEntries = async (entries, collectionName) => {
        await Promise.all(
          entries.map(async (entry) => {
            let imageUrl = "";
            if (entry.image) {
              const uniqueFileName = `${uuidv4()}-${entry.image.name}`; // Generate a unique file name
              const imageRef = ref(storage, `${collectionName}/${descriptionId}/${uniqueFileName}`);
              const uploadTask = await uploadBytesResumable(imageRef, entry.image);
              imageUrl = await getDownloadURL(uploadTask.ref);
            }
            await setDoc(doc(collection(db, collectionName)), {
              description_id: descriptionId,
              title: entry.title,  // Add the title field
              image_url: imageUrl,
              text: entry.text,
              created_at: serverTimestamp(),
            });
          })
        );
      };

      await uploadEntries(overviews, "descriptionOverviews");
      await uploadEntries(options, "descriptionOptions");
      await uploadEntries(designs, "descriptionDesigns");

      // Step 5: Save the product description in the productDescription collection
      await setDoc(doc(db, "productDescriptions", descriptionId), {
        description_id: descriptionId,
        description: description,
        created_at: serverTimestamp(),
      });
  
      alert("Product and description added successfully!");

      // Clear form fields
      setProductName("");
      setPrice("");
      setDescription(""); // Clear description
      setSelectedCategoryId("");
      setProductImages([{ file: null }]); // Clear product images
      setProductRequirements(productParametersPrototype);
      setOpenSections({}); // Reset the dropdown sections
      setOverviews([{ title: "", text: "", image: null }]);
      setOptions([{ title: "", text: "", image: null }]);
      setDesigns([{ title: "", text: "", image: null }]);
      document.querySelectorAll('input[type="file"]').forEach(input => input.value = ""); // Clear file inputs

    } catch (e) {
      console.error("Error adding product and description: ", e);
    }
  };

  const renderCheckboxes = (field, label) => (
    <div className="dropdown-section" key={field}>
      <button
        type="button"
        className="dropdown-button"
        onClick={() => handleDropdownToggle(field)}
      >
        {label}
      </button>
      {openSections[field] && (
        <div className="dropdown-content checkbox-group">
          {productParameters[field]?.map((item, index) => (
            <label key={index}>
              <input
                type="checkbox"
                value={item}
                checked={productRequirements[field]?.includes(item)}
                onChange={(e) => handleCheckboxChange(e, field)}
              />
              {item}
            </label>
          ))}
          <label>
            <input
              type="checkbox"
              value="null"
              checked={productRequirements[field]?.length === 0}
              onChange={(e) => handleCheckboxChange(e, field)}
            />
            No Data
          </label>
        </div>
      )}
    </div>
  );

  const renderImageTextFields = (entries, setEntries, handleChange, label, addField) => (
    <>
      <h3>{label}</h3>
      {entries.map((entry, index) => (
        <div key={index} className="image-text-entry">
          <label>
            Title:
            <input
              type="text"
              value={entry.title}
              onChange={(e) => handleChange(index, "title", e.target.value)}
            />
          </label>
          <label>
            Image:
            <input
              type="file"
              onChange={(e) => handleChange(index, "image", e.target.files[0])}
            />
          </label>
          <label>
            Text:
            <textarea
              value={entry.text}
              onChange={(e) => handleChange(index, "text", e.target.value)}
            />
          </label>
        </div>
      ))}
      <button type="button" onClick={addField}>Add More {label}</button>
    </>
  );

  const renderProductImageFields = () => (
    <>
      <h3>Product Images</h3>
      {productImages.map((imageObj, index) => (
        <div key={index} className="image-entry">
          <label>
            Image {index + 1}:
            <input
              type="file"
              onChange={(e) => handleImageChange(index, e)}
              required
            />
          </label>
          <button type="button" onClick={() => removeImageField(index)} disabled={productImages.length === 1}>
            Remove
          </button>
        </div>
      ))}
      <button type="button" onClick={addImageField}>Add More Images</button>
      <br></br>
      <br></br>
    </>
  );

  return (
    <div className="product-form-container">
      <h2>Add a New Product</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>
            Product Name:
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              required
            />
          </label>
        </div>
        <div>
          <label>
            Price:
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </label>
        </div>
        <div>
          <label>
            Category:
            <select
              value={selectedCategoryId}
              onChange={handleCategoryChange}
              required
            >
              <option value="" disabled>Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.category_name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {renderProductImageFields()}

        <div>
          <label>
            Product Description:
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </label>
        </div>

        {renderImageTextFields(overviews, setOverviews, handleOverviewChange, "Overview", addOverviewField)}
        {renderImageTextFields(options, setOptions, handleOptionsChange, "Options", addOptionsField)}
        {renderImageTextFields(designs, setDesigns, handleDesignsChange, "Designs", addDesignsField)}

        <h3>Product Requirements</h3>
        {Object.keys(productParameters).map(field => 
          renderCheckboxes(field, field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))
        )}
        
        <button type="submit">Submit</button>
      </form>
    </div>
  );
};

export default ProductForm;
