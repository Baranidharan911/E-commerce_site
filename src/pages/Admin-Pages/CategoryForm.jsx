import React, { useState } from "react";
import { collection, setDoc, doc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import './CategoryForm.css'; // Import the CSS file

const CategoryForm = () => {
  const [categoryName, setCategoryName] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Create a document ID based on the category name, making it URL-friendly
      const categoryId = categoryName.toLowerCase().replace(/\s+/g, '-');

      // Use setDoc to create a new document in the "categories" collection with the custom ID
      const docRef = doc(db, "categories", categoryId);
      await setDoc(docRef, {
        category_name: categoryName,
        description: description,
        category_id: categoryId // Set the custom ID as the category_id
      });

      alert("Category added successfully!");
      setCategoryName("");
      setDescription("");
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  };

  return (
    <div className="category-form-container">
      <h2>Add a New Category</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>
            Category Name:
            <input
              type="text"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              required
            />
          </label>
        </div>
        <div>
          <label>
            Description:
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </label>
        </div>
        <button type="submit">Submit</button>
      </form>
    </div>
  );
};

export default CategoryForm;
