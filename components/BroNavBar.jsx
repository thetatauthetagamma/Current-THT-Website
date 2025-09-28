import React from 'react'
import Link from 'next/link';
import { useState, useEffect } from 'react';
import supabase from '@/supabase';


export default function BroNavBar({ isPledge }) {
  const [userEmail, setUserEmail] = useState();
  const [userid, setuserid] = useState();
  const [firstname, setFirstname] = useState();
  const [isAdmin, setIsAdmin] = useState(false);
  const getGreeting = () => {
    const currentTime = new Date().getHours();

    if (currentTime >= 5 && currentTime < 12) {
      return 'Good morning';
    } else if (currentTime >= 12 && currentTime < 18) {
      return 'Good afternoon';
    } else {
      return 'Good evening';
    }
  };

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
  }, []);

  useEffect(() => {
    const checkIfBrother = async () => {
      const { data, error } = await supabase
        .from('Brothers')
        .select('*')
        .eq('email', userEmail);
      if (data?.length === 1 && !error) {
        setFirstname(data[0].firstname);
        setuserid(userEmail.slice(0, -10)); // Move the setuserid here
      }
    };

    const isPledge = async () => {
      const { data, error } = await supabase
        .from('Pledges')
        .select('*')
        .eq('email', userEmail);
      if (data?.length === 1 && !error) {
        setFirstname(data[0].firstname);
        setuserid(userEmail.slice(0, -10));
      }
    };
    const fetchAdminRole = async () => {
      try {
        const { data, error } = await supabase
          .from('Brothers')
          .select('adminrole')
          .eq('email', userEmail)

        if (error) {
          throw error
        }
        if (data) {
          if (data[0].adminrole && data[0].adminrole != '') {
            setIsAdmin(true)
          }
        }
      } catch (error) { }
    }

    isPledge();
    checkIfBrother();
    fetchAdminRole();
  }, [userEmail]);

  return (
    <div className="md:border-r-2 md:border-b-0 border-r-0 border-b-2 border-[#a3000020] flex-col justify-center items-center lg:w-1/4 flex-shrink-0">
      <div className="pt-4 pl-6 pr-6 pb-4">
        <p className="font-bold text-xl bg-[#8b000070] p-4 rounded-md text-center mb-4">{getGreeting()}, {firstname}!</p>

        {
          isPledge ? (
            <ul className="space-y-2 font-bold space-5">
              {/* <Link legacyBehavior href="/pledges/pledgecalendar">
                      <li className="hover:bg-[#8b000070] transition-colors duration-300 rounded flex-grow py-4 pl-2">
                        <a>Calendar</a>
                      </li>
                    </Link> */}
              <Link legacyBehavior href="/pledges/progress">
                <li className="hover:bg-[#8b000070] transition-colors duration-300 rounded flex-grow py-4 pl-2">
                  <a>Your Progress</a>
                </li>
              </Link>
              <Link legacyBehavior href={`/members/${userid}`}>
                <li className="hover:bg-[#8b000070] transition-colors duration-300 rounded flex-grow py-4 pl-2">
                  <a>Your Profile</a>
                </li>
              </Link>
              <Link legacyBehavior href="/members/memberdirectory">
                <li className="hover:bg-[#8b000070] transition-colors duration-300 rounded flex-grow py-4 pl-2">
                  <a>Member Directory</a>
                </li>
              </Link>
              <Link legacyBehavior href="/members/studybuddysearch">
                <li className="hover:bg-[#8b000070] transition-colors duration-300 rounded flex-grow py-4 pl-2">
                  <a>Study Buddy 🔎</a>
                </li>
              </Link>
              <Link legacyBehavior href="/members/familytree">
                <li className="hover:bg-[#8b000070] transition-colors duration-300 rounded flex-grow py-4 pl-2">
                  <a>Family Tree</a>
                </li>
              </Link>
            </ul>
          )
            :
            (
              <ul className="space-y-2 font-bold space-5">
                <Link legacyBehavior href="/brothers">
                  <li className="hover:bg-[#8b000070] transition-colors duration-300 rounded flex-grow py-4 pl-2">
                    <a>Calendar</a>
                  </li>
                </Link>
                <Link legacyBehavior href={`/members/${userid}`}>
                  <li className="hover:bg-[#8b000070] transition-colors duration-300 rounded flex-grow py-4 pl-2">
                    <a>My Profile</a>
                  </li>
                </Link>
                <Link legacyBehavior href="/brothers/pledgetracking">
                  <li className="hover:bg-[#8b000070] transition-colors duration-300 rounded flex-grow py-4 pl-2">
                    <a>PNM Tracking</a>
                  </li>
                </Link>
                <Link legacyBehavior href="/brothers/broresources">
                  <li className="hover:bg-[#8b000070] transition-colors duration-300 rounded flex-grow py-4 pl-2">
                    <a>Resources</a>
                  </li>
                </Link>
                <Link legacyBehavior href="/members/memberdirectory">
                  <li className="hover:bg-[#8b000070] transition-colors duration-300 rounded flex-grow py-4 pl-2">
                    <a>Member Directory</a>
                  </li>
                </Link>
                <Link legacyBehavior href="/members/studybuddysearch">
                  <li className="hover:bg-[#8b000070] transition-colors duration-300 rounded flex-grow py-4 pl-2">
                    <a>Study Buddy 🔎</a>
                  </li>
                </Link>
                <Link legacyBehavior href="/members/familytree">
                  <li className="hover:bg-[#8b000070] transition-colors duration-300 rounded flex-grow py-4 pl-2">
                    <a>Family Tree</a>
                  </li>
                </Link>
                {/* <Link legacyBehavior href="/brothers/rushbook">
                <li className="hover:bg-[#8b000070] transition-colors duration-300 rounded flex-grow py-4 pl-2">
                  <a>RushBook</a>
                </li>
              </Link> */}
                {isAdmin && (
                  <Link legacyBehavior href="/brothers/admin">
                    <li className="hover:bg-[#8b000070] transition-colors duration-300 rounded flex-grow py-4 pl-2">
                      <a>Admin</a>
                    </li>
                  </Link>
                )}
              </ul>
            )
        }
      </div>
    </div>
  )
}
