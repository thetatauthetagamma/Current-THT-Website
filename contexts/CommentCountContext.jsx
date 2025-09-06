import React, { createContext, useContext, useState, useEffect } from 'react';
import supabase from '@/supabase';

// Create context
const CommentCountContext = createContext();

// Provider component
export const CommentCountProvider = ({ children }) => {
  const [commentCounts, setCommentCounts] = useState({});
  const [loading, setLoading] = useState(true);

  // Fetch all comment counts once
  useEffect(() => {
    const fetchAllCommentCounts = async () => {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('Application_Feedback')
        .select('rushee, value_type')
        .eq('value_type', 'comment');
      
      if (!error && data) {
        // Count comments for each rushee
        const counts = data.reduce((acc, item) => {
          acc[item.rushee] = (acc[item.rushee] || 0) + 1;
          return acc;
        }, {});
        
        setCommentCounts(counts);
      } else {
        console.error('Error fetching comment counts:', error);
      }
      
      setLoading(false);
    };
    
    fetchAllCommentCounts();
  }, []);

  return (
    <CommentCountContext.Provider value={{ commentCounts, loading }}>
      {children}
    </CommentCountContext.Provider>
  );
};

// Custom hook to use the comment counts context
export const useCommentCounts = () => {
  const context = useContext(CommentCountContext);
  if (context === undefined) {
    throw new Error('useCommentCounts must be used within a CommentCountProvider');
  }
  return context;
};
