import React, { useEffect, useState } from 'react';
import supabase from '../../supabase';
import BroNavBar from "@/components/BroNavBar";
import PledgeTilePledgeView from '../../components/PledgeTilePledgeView';


/*
This is the page that pledges see to view their own progress.
Most of the logic for it is in the PledgeTilePledgeView component.

*/
export default function progress() {
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pledgeUniqname, setPledgeUniqname] = useState('');
  //fetches the logged in users email from the session
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const session = await supabase.auth.getSession();
        if (session) {
          setUserEmail(session.data.session?.user.email || '');
        }
      } catch (error) {
        console.log(error);
      }
    };

    fetchSession();
    console.log("Fidget Fam == Best Fam")
  }, []);

  //fetches the uniqname of the pledge
  useEffect(() => {
    const fetchPledgeUniqname = () => {
      const truncatedEmail = userEmail.slice(0, -10);
      setPledgeUniqname(truncatedEmail);
    };

    fetchPledgeUniqname();
  }, [userEmail]);

  useEffect(() => {
    const fetchPledgeDetails = async () => {
      try {
        const { data, error } = await supabase
          .from('Pledges')
          .select('*')
          .eq('uniqname', pledgeUniqname);

        if (error) throw error;

        if (data && data.length > 0) {
          setLoading(false);
          setError(null);
        } else {
          throw new Error('Pledge details not found.');
        }
      } catch (error) {
        
        setLoading(false);
      }
    };

    if (pledgeUniqname) {
      fetchPledgeDetails();
    }
  }, [pledgeUniqname]);

  return (
    <div className="flex md:flex-row flex-col flex-grow  border-b-2 border-[#a3000020]">
      <BroNavBar isPledge={true}/>
      <div className="flex-grow">
        <div className="flex-grow h-full m-4">
          {loading ? (
            <div>Loading...</div>
          ) : error ? (
            <div>Error: {error}</div>
          ) : (
            <PledgeTilePledgeView pledge={pledgeUniqname}/>
          )}
        </div>
      </div>
    </div>
  );
};
