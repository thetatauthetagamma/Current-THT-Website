import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import supabase from '../../supabase';
import BroNavBar from "@/components/BroNavBar";
import { uniqnameFromEmail } from '@/utils/roles';
import PledgeTilePledgeView from '../../components/PledgeTilePledgeView';


/*
This is the page that pledges see to view their own progress.
Most of the logic for it is in the PledgeTilePledgeView component.
Parent admins can view a specific pledge's progress by passing ?uniqname=xxx in the URL.

*/
export default function progress() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pledgeUniqname, setPledgeUniqname] = useState('');
  const [isParentAdmin, setIsParentAdmin] = useState(false);
  const [viewingAsParent, setViewingAsParent] = useState(false);
  const [hasLinkedin, setHasLinkedin] = useState<boolean | null>(null); // null = not loaded yet

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

  // Check if user is parent admin
  useEffect(() => {
    const checkParentAdmin = async () => {
      if (!userEmail) return;
      try {
        const { data, error } = await supabase
          .from('Brothers')
          .select('adminrole')
          .eq('email', userEmail)
          .maybeSingle(); // PNMs have no Brothers row: no error / 406 in the console

        if (!error && data && data.adminrole === 'parent') {
          setIsParentAdmin(true);
        }
      } catch (error) {
        console.error('Error checking admin role:', error);
      }
    };
    checkParentAdmin();
  }, [userEmail]);

  // Determine which pledge uniqname to use
  useEffect(() => {
    const queryUniqname = router.query.uniqname as string | undefined;
    
    // If there's a query parameter and user is parent admin, use that
    if (queryUniqname && isParentAdmin) {
      setPledgeUniqname(queryUniqname);
      setViewingAsParent(true);
    } else if (userEmail) {
      // Otherwise, use the logged-in user's uniqname
      setPledgeUniqname(uniqnameFromEmail(userEmail));
      setViewingAsParent(false);
    }
  }, [router.query.uniqname, userEmail, isParentAdmin]);

  useEffect(() => {
    const fetchPledgeDetails = async () => {
      try {
        const { data, error } = await supabase
          .from('Pledges')
          .select('uniqname, linkedin')
          .eq('uniqname', pledgeUniqname);

        if (error) throw error;

        if (data && data.length > 0) {
          setHasLinkedin(Boolean(String(data[0].linkedin ?? '').trim()));
          setLoading(false);
          setError(null);
        } else {
          throw new Error('PNM details not found.');
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
      <BroNavBar isPledge={!viewingAsParent}/>
      <div className="flex-grow">
        <div className="flex-grow h-full m-4">
          {loading ? (
            <div>Loading...</div>
          ) : error ? (
            <div>Error: {error}</div>
          ) : (
            <>
              {/* PNMs can add their LinkedIn on their profile so they are in the alumni directory once they join. */}
              {!viewingAsParent && hasLinkedin === false && (
                <div className="bg-white rounded shadow p-4 mb-4 border-t-4 border-red-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <p className="text-sm">
                    <span className="font-bold">Add your LinkedIn.</span> It takes a minute, and it gets you into the alumni directory when you join.
                  </p>
                  <Link
                    href={`/members/${pledgeUniqname}`}
                    className="text-center text-sm font-bold bg-red-800 text-white rounded px-4 py-2 hover:bg-red-900 transition-colors duration-300"
                  >
                    Add LinkedIn
                  </Link>
                </div>
              )}
              <PledgeTilePledgeView pledge={pledgeUniqname}/>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
