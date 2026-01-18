import React, { createContext, useContext, useState, useEffect } from 'react';
import supabase from '@/supabase';

// Create context
const ApplicationReviewCountContext = createContext();

// Provider component
export const ApplicationReviewCountProvider = ({ children }) => {
  const [reviewCounts, setReviewCounts] = useState({});
  const [loading, setLoading] = useState(true);

  // Fetch all application review counts once
  useEffect(() => {
    const fetchAllReviewCounts = async () => {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('Application_Feedback')
        .select('rushee, value_type')
        .eq('value_type', 'app_comment');
      
      if (!error && data) {
        // Count application reviews for each rushee
        const counts = data.reduce((acc, item) => {
          acc[item.rushee] = (acc[item.rushee] || 0) + 1;
          return acc;
        }, {});
        
        setReviewCounts(counts);
      } else {
        console.error('Error fetching application review counts:', error);
      }
      
      setLoading(false);
    };
    
    fetchAllReviewCounts();
  }, []);

  return (
    <ApplicationReviewCountContext.Provider value={{ reviewCounts, loading }}>
      {children}
    </ApplicationReviewCountContext.Provider>
  );
};

// Custom hook to use the application review counts context
export const useApplicationReviewCounts = () => {
  const context = useContext(ApplicationReviewCountContext);
  if (context === undefined) {
    throw new Error('useApplicationReviewCounts must be used within an ApplicationReviewCountProvider');
  }
  return context;
};
