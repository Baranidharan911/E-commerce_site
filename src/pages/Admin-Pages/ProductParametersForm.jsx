import React, { useState, useEffect } from "react";
import { collection, query, getDocs, setDoc, doc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { productParametersPrototype, productSpecsPrototype } from "../../components/Utils";

import './ProductParametersForm.css'; 

const ProductParametersForm = () => {
  const [productParameters, setProductParameters] = useState(productParametersPrototype);
  const [docId, setDocId] = useState(null);
  const [newValues, setNewValues] = useState(productSpecsPrototype);

  useEffect(() => {
    const fetchProductParameters = async () => {
      try {
        const q = query(collection(db, "productParameters"));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const existingDoc = querySnapshot.docs[0];
          setDocId(existingDoc.id);
          setProductParameters(existingDoc.data());
        }
      } catch (error) {
        console.error("Error fetching product parameters: ", error);
      }
    };

    fetchProductParameters();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (docId) {
        const docRef = doc(db, "productParameters", docId);

        const updatedParameters = { ...productParameters };

        for (const field in newValues) {
          if (newValues[field]) {
            let newValuesArray;

            if (field === "quantity") {
              newValuesArray = newValues[field]
                .split(",")
                .map((item) => parseInt(item.trim(), 10))
                .filter((num) => !isNaN(num));
            } else {
              newValuesArray = newValues[field]
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean);
            }

            updatedParameters[field] = [
              ...new Set([...(productParameters[field] || []), ...newValuesArray]),
            ]; // Ensures unique values
          }
        }

        // Update the Firestore document
        await setDoc(docRef, updatedParameters, { merge: true });

        setProductParameters(updatedParameters); // Update the state with new values
        setNewValues(productSpecsPrototype); // Reset input fields

        alert("Product parameters updated successfully!");
      } else {
        console.error("No document ID found. Please ensure there is a document in the collection.");
      }
    } catch (e) {
      console.error("Error updating product parameters: ", e);
    }
  };

  const handleInputChange = (field, value) => {
    setNewValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDeleteItem = async (field, index) => {
    const updatedFieldArray = (productParameters[field] || []).filter((_, i) => i !== index);
    const updatedParameters = { ...productParameters, [field]: updatedFieldArray };

    try {
      if (docId) {
        const docRef = doc(db, "productParameters", docId);
        await setDoc(docRef, updatedParameters, { merge: true });
        setProductParameters(updatedParameters);
      }
    } catch (e) {
      console.error("Error deleting item: ", e);
    }
  };

  const renderFieldInput = (field, label, isNumber = false) => (
    <div style={{ marginBottom: "20px" }} key={field}>
      <label>
        {label} :
        <input
          type={isNumber ? "number" : "text"}
          value={newValues[field]}
          onChange={(e) => handleInputChange(field, e.target.value)}
          style={{ marginLeft: "10px", width: "100%" }}
        />
      </label>
      {(productParameters[field] || []).length > 0 && (
        <ul>
          {productParameters[field].map((item, index) => (
            <li key={index} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span>{item}</span>
              <button
                type="button"
                onClick={() => handleDeleteItem(field, index)}
                style={{ marginLeft: "10px", backgroundColor: "#ff5c5c", color: "white", border: "none", padding: "5px 10px", borderRadius: "4px", cursor: "pointer" }}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  const renderInputsDynamically = () => {
    return Object.keys(productParameters).map(field => {
      const isNumberField = field === "quantity"; // Assuming "quantity" is the only number field
      const label = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()); // Convert field name to a more readable format
      return renderFieldInput(field, label, isNumberField);
    });
  };

  return (
    <div className="product-parameters-container">
      <h2>Add Product Parameters</h2>
      <form onSubmit={handleSubmit}>
        {renderInputsDynamically()}
        <button type="submit">Submit</button>
      </form>
    </div>
  );
};

export default ProductParametersForm;
