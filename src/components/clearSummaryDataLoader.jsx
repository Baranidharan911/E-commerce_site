import { useContext } from 'react';
import { SummaryContext } from '../context/SummaryContext';

// Function to clear summary data
export const clearSummaryDataLoader = () => {
  const { resetSummaryData } = useContext(SummaryContext);

  // Clear localStorage and reset context state
  localStorage.removeItem('summaryData');

  if (resetSummaryData) {
    resetSummaryData();
  }
  return null;
};
