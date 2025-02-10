// middleware/auth.ts
import supabase from './supabase';

export const isBrother = async (userEmail) => {
  try {
    if (userEmail) {
      const { data, error } = await supabase.from('Brothers').select('*').eq('email', userEmail.value);
      return data?.length === 1 && !error;
    }
    return false;
  } catch (error) {
    console.error('Error checking brother status:', error);
    return false;
  }
};

export const isPledge = async (userEmail) => {
  try {
    if (userEmail) {
      const { data, error } = await supabase.from('Pledges').select('*').eq('email', userEmail.value);
      return data?.length === 1 && !error;
    }
    return false;
  } catch (error) {
    console.error('Error checking pledge status:', error);
    return false;
  }
};

export const isAdmin = async (userEmail) => {
  try {
    if (userEmail) {
      const { data, error } = await supabase
        .from('Brothers')
        .select('adminrole')
        .eq('email', userEmail.value) // Assuming userEmail is a string

      if (error || !data || data.length === 0) {
        // console.error('Error checking admin status or no data found:', error);
        return false;
      }

      // Ensure data[0] exists and has the adminrole property
      return data[0].adminrole && data[0].adminrole !== '';
    }
    return false;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};