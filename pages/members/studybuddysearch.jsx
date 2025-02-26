import React, { useEffect, useState } from 'react'
import BroNavBar from '@/components/BroNavBar'
import ClassMemberTile from '@/components/ClassMemberTile'
import supabase from '../../supabase'
import Cookies from 'js-cookie'

/*
This page is used to search for members who are taking the same class as you.
Classes are stored in both the Pledges and Brothers table in the column classes.
At the end of the semester, classes are moved to the archivedClasses column.
TODO: Add functionality to search for brothers who have already taken your class.
*/

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
          const sortedPledges = pledgeData.data.sort(
            (a, b) => b.lastname - a.lastname
          );
          combinedMembers.push(...sortedPledges);
        }

        if (brothersData.data && !brothersData.error) {
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
    setCurrentPageCurrent(prevPage => Math.min(prevPage + 1, totalCurrentPages));
  };

  const handlePrevPageCurrent = () => {
    setCurrentPageCurrent(prevPage => Math.max(prevPage - 1, 1));
  };

  const handleNextPagePast = () => {
    setCurrentPagePast(prevPage => Math.min(prevPage + 1, totalPastPages));
  };

  const handlePrevPagePast = () => {
    setCurrentPagePast(prevPage => Math.max(prevPage - 1, 1));
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
    return null;
  }

  return (
    <div className='flex md:flex-row flex-col flex-grow border-b-2 border-[#a3000020]'>
      {isPledge ? (
        <BroNavBar isPledge={true} />
      ) : (
        <BroNavBar isPledge={false} />
      )}
      <div className='flex-grow '>
        <div className='flex-grow h-full m-4'>
          <h1 className='font-bold text-4xl xs:max-sm:text-center pb-4'>
            Find Study Buddies
          </h1>
          <input
            type='text'
            placeholder='Search by class name and number (EECS 482, MECHENG 211, AEROSP 200)'
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className='p-2 border border-gray-800 rounded w-full mb-4'
          />
          <div className='mb-4'>
            <h2 className='font-bold text-2xl'>Currently Enrolled</h2>
            <div
              className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full'
              style={{ maxHeight: '550px', overflowY: 'auto' }}
            >
              {currentMembers.map(member => (
                <div key={member.userid ? member.userid : member.uniqname}>
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
            <div className='flex justify-between mt-4'>
              <button onClick={handlePrevPageCurrent} disabled={currentPageCurrent === 1}>
                &larr; Previous Page
              </button>
              <button
                onClick={handleNextPageCurrent}
                disabled={currentPageCurrent === totalCurrentPages}
              >
                &rarr; Next Page
              </button>
            </div>
          </div>
          <div>
            <h2 className='font-bold text-2xl'>Previously Enrolled</h2>
            <div
              className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full'
              style={{ maxHeight: '550px', overflowY: 'auto' }}
            >
              {pastMembers.map(member => (
                <div key={member.userid ? member.userid : member.uniqname}>
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
            <div className='flex justify-between mt-4'>
              <button onClick={handlePrevPagePast} disabled={currentPagePast === 1}>
                &larr; Previous Page
              </button>
              <button
                onClick={handleNextPagePast}
                disabled={currentPagePast === totalPastPages}
              >
                &rarr; Next Page
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}