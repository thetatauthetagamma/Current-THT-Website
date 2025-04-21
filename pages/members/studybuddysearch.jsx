import React, { useEffect, useState } from 'react'
import BroNavBar from '@/components/BroNavBar'
import ClassMemberTile from '@/components/ClassMemberTile'
import supabase from '../../supabase'
import Cookies from 'js-cookie'

export default function StudyBuddySearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [isPledge, setIsPledge] = useState(true);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPageCurrent, setCurrentPageCurrent] = useState(1);
  const [currentPagePast, setCurrentPagePast] = useState(1);
  const membersPerPage = 8;

  useEffect(() => {
    setUserEmail(Cookies.get('userEmail'));
    const fetchData = async () => {
      try {
        const [pledgeData, brothersData] = await Promise.all([
          supabase.from('Pledges').select('*'),
          supabase.from('Brothers').select('*')
        ]);

        let combinedMembers = [];

        if (pledgeData.data && !pledgeData.error) {
          // Sort pledges in descending order by lastname
          const sortedPledges = pledgeData.data.sort(
            (a, b) => b.lastname - a.lastname
          );
          combinedMembers.push(...sortedPledges);
        }

        if (brothersData.data && !brothersData.error) {
          // Sort brothers in descending order by roll
          const sortedData = brothersData.data.sort((a, b) => b.roll - a.roll);
          combinedMembers.push(...sortedData);
        }

        setMembers(combinedMembers);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userEmail]);

  useEffect(() => {
    setCurrentPageCurrent(1);
    setCurrentPagePast(1);
  }, [searchQuery]);

  useEffect(() => {
    const checkIfBrother = async () => {
      const { data, error } = await supabase
        .from('Brothers')
        .select('*')
        .eq('email', userEmail);
      if (data?.length === 1 && !error) {
        setIsPledge(false);
      }
    };

    const checkIfPledge = async () => {
      const { data, error } = await supabase
        .from('Pledges')
        .select('*')
        .eq('email', userEmail);
      if (data?.length === 1 && !error) {
        setIsPledge(true);
      }
    };

    checkIfBrother();
    checkIfPledge();
    console.log("Fidget Fam == Best Fam")
  }, [userEmail]);

  const normalizedQuery = searchQuery.toLowerCase();

  const currentClassMembers = members.filter(member => {
    if (member.classes && member.classes.length > 0) {
      return member.classes.some(className =>
        className.toLowerCase().includes(normalizedQuery)
      );
    }
    return false;
  });

  const pastClassMembers = members.filter(member => {
    if (member.archivedclasses && member.archivedclasses.length > 0) {
      return member.archivedclasses.some(className =>
        className.toLowerCase().includes(normalizedQuery)
      );
    }
    return false;
  });

  const totalCurrentPages = Math.ceil(currentClassMembers.length / membersPerPage);
  const totalPastPages = Math.ceil(pastClassMembers.length / membersPerPage);

  const handleNextPageCurrent = () => {
    setCurrentPageCurrent(prev => Math.min(prev + 1, totalCurrentPages));
  };

  const handlePrevPageCurrent = () => {
    setCurrentPageCurrent(prev => Math.max(prev - 1, 1));
  };

  const handleNextPagePast = () => {
    setCurrentPagePast(prev => Math.min(prev + 1, totalPastPages));
  };

  const handlePrevPagePast = () => {
    setCurrentPagePast(prev => Math.max(prev - 1, 1));
  };

  const indexOfLastMemberCurrent = currentPageCurrent * membersPerPage;
  const indexOfFirstMemberCurrent = indexOfLastMemberCurrent - membersPerPage;
  const currentMembers = currentClassMembers.slice(
    indexOfFirstMemberCurrent,
    indexOfLastMemberCurrent
  );

  const indexOfLastMemberPast = currentPagePast * membersPerPage;
  const indexOfFirstMemberPast = indexOfLastMemberPast - membersPerPage;
  const pastMembers = pastClassMembers.slice(
    indexOfFirstMemberPast,
    indexOfLastMemberPast
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Left Nav */}
      {isPledge ? <BroNavBar isPledge /> : <BroNavBar isPledge={false} />}

      {/* Main Content */}
      <div className="flex-grow p-4 md:p-8">
        {/* Page Header / Intro */}
        <div className="bg-white rounded shadow p-4 mb-6">
          <h1 className="font-bold text-2xl md:text-3xl mb-2">Find Study Buddies</h1>
          <p className="text-gray-600 mb-4">
            Search by class name and number (e.g. "EECS 482", "MECHENG 211", "AEROSP 200").
          </p>
          <input
            type="text"
            placeholder="Type a class..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>

        {/* Currently Enrolled Section */}
        <div className="bg-white rounded shadow p-4 mb-6">
          <h2 className="font-bold text-xl md:text-2xl mb-4">Currently Enrolled</h2>
          {currentMembers.length === 0 ? (
            <p className="text-gray-600">No members found for this query.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-[550px] overflow-y-auto">
              {currentMembers.map(member => (
                <div
                  key={member.userid ? member.userid : member.uniqname}
                  className="bg-gray-50 rounded-lg p-4 shadow hover:shadow-md transition"
                >
                  <ClassMemberTile
                    userid={member.userid ? member.userid : member.uniqname}
                    firstname={member.firstname}
                    lastname={member.lastname}
                    email={member.email}
                    phone={member.phone}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Pagination for Current */}
          {currentMembers.length > 0 && (
            <div className="flex justify-between items-center mt-4">
              <button
                onClick={handlePrevPageCurrent}
                disabled={currentPageCurrent === 1}
                className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
              >
                &larr; Previous
              </button>
              <p>
                Page {currentPageCurrent} of {totalCurrentPages || 1}
              </p>
              <button
                onClick={handleNextPageCurrent}
                disabled={currentPageCurrent === totalCurrentPages || totalCurrentPages === 0}
                className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
              >
                Next &rarr;
              </button>
            </div>
          )}
        </div>

        {/* Previously Enrolled Section */}
        <div className="bg-white rounded shadow p-4">
          <h2 className="font-bold text-xl md:text-2xl mb-4">Previously Enrolled</h2>
          {pastMembers.length === 0 ? (
            <p className="text-gray-600">No members found for this query.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-[550px] overflow-y-auto">
              {pastMembers.map(member => (
                <div
                  key={member.userid ? member.userid : member.uniqname}
                  className="bg-gray-50 rounded-lg p-4 shadow hover:shadow-md transition"
                >
                  <ClassMemberTile
                    userid={member.userid ? member.userid : member.uniqname}
                    firstname={member.firstname}
                    lastname={member.lastname}
                    email={member.email}
                    phone={member.phone}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Pagination for Past */}
          {pastMembers.length > 0 && (
            <div className="flex justify-between items-center mt-4">
              <button
                onClick={handlePrevPagePast}
                disabled={currentPagePast === 1}
                className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
              >
                &larr; Previous
              </button>
              <p>
                Page {currentPagePast} of {totalPastPages || 1}
              </p>
              <button
                onClick={handleNextPagePast}
                disabled={currentPagePast === totalPastPages || totalPastPages === 0}
                className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
              >
                Next &rarr;
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
