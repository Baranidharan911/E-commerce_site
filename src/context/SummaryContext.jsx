import React, { createContext, useState, useEffect } from 'react';

export const SummaryContext = createContext();

export const SummaryProvider = ({ children }) => {
  // Initialize summaryData from localStorage or set default values
  const [summaryData, setSummaryData] = useState(() => {
    const savedData = localStorage.getItem('summaryData');
    return savedData
      ? JSON.parse(savedData)
      : {
          files: [],         // Array to hold uploaded design files
          design_info: '',   // Design information or description
          product_id: '',    // Ensure product_id is initialized to avoid missing key
        };
  });

  // Every time summaryData is updated, save it to localStorage
  useEffect(() => {
    localStorage.setItem('summaryData', JSON.stringify(summaryData));
  }, [summaryData]);

  // Function to update summaryData
  const updateSummaryData = (newData) => {
    setSummaryData((prevData) => {
      const updatedData = {
        ...prevData,
        ...newData,
      };

      // Ensure product_id is not lost during update
      if (!updatedData.product_id) {
        console.error("Warning: product_id is missing in summaryData", updatedData);
      }

      return updatedData;
    });
  };

  // Function to load summaryData from localStorage
  const loadSummaryData = () => {
    const savedData = localStorage.getItem('summaryData');
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      if (!parsedData.product_id) {
        console.error("Warning: Loaded summaryData is missing product_id");
      }
      setSummaryData(parsedData);
    }
  };

  // Function to reset the summaryData to default values
  const resetSummaryData = () => {
    const defaultData = {
      files: [],
      design_info: '',
      product_id: '',  // Reset product_id as well
    };

    setSummaryData(defaultData);
  };

  return (
    <SummaryContext.Provider
      value={{
        summaryData,
        updateSummaryData,
        loadSummaryData,
        resetSummaryData,
      }}
    >
      {children}
    </SummaryContext.Provider>
  );
};
