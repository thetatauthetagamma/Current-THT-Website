import { NextPage } from "next";
import { useEffect, useState } from "react";
import supabase from "../../supabase";
import PledgeTile from '../../components/PledgeTile'
import BroNavBar from "@/components/BroNavBar";

import Image from "next/image"
import NewPledgeTile from "../../components/newPledge"
/*
This is the page that brothers see to view pleding progress.
Most of the logic for the pledge tracking is in the PledgeTile component.
The NewPledgeTile is a tile that only the moms see and is used to add new pledges to the database. 
*/
interface PledgeData {
  uniqname: string;
  firstname: string;
}

import React from 'react'

export default function pledgetracking() {

  const [pledges, setPledges] = useState<PledgeData[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');


  const [userID, setUserID] = useState('')
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  useEffect(() => {

    fetchPledges();
  }, []);

  const fetchPledges = async () => {
    try {
      const { data, error } = await supabase.from('Pledges').select('uniqname, firstname');

      if (error) {
        throw error;
      }

      if (data) {
        setPledges(data as PledgeData[]);
      }
    } catch (error) {
      console.error('Error fetching pledges:', error);
    }
  };

  useEffect(() => {
    console.log("Fidget Fam == Best Fam")
    const fetchSession = async () => {
      try {
        const session = await supabase.auth.getSession()
        if (session) {
          setUserID(session.data.session?.user.email || '')
        }
      } catch (error) { }
    }

    fetchSession()
  }, [])


  useEffect(() => {
    const fetchAdminRole = async () => {
      try {
        const { data, error } = await supabase
          .from('Brothers')
          .select('adminrole')
          .eq('email', userID)

        if (error) {
          throw error
        }
        if (data) {
          if (data[0].adminrole == 'parent' ||data[0].adminrole == 'dev' ) {
            setIsAdmin(true);
          }
        }
      } catch (error) { }
    }
    fetchAdminRole()
  }, [userID])



  const filteredPledges = searchQuery
    ? pledges.filter(
      pledge =>
        pledge.uniqname.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pledge.firstname.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : pledges;

  return (
    <div className="flex md:flex-row flex-col flex-grow border-b-2 border-[#a3000020]">
      <BroNavBar isPledge={false} />
      <div className="flex-grow">
        <div className="flex-grow h-full m-4">
          <h1 className="font-bold text-4xl xs:max-sm:text-center pb-2">Pledge Progress</h1>
          <div className="bg-white rounded shadow p-4 mb-6">
          <a
            href="https://forms.gle/SM3GDZzfLDXgfhDz6"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-4 py-2 bg-blue-500 text-white font-medium rounded hover:bg-blue-600 transition"
          >
            👶 Fill Out the Pledge Feedback Form
          </a>
        </div>
          {/* Search Bar */}
          <input
            type="text"
            placeholder="Search by pledge first name"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="p-2 border border-gray-800 rounded w-full mb-4"
          />
          <div style={{ maxHeight: '550px', overflowY: 'auto' }} >
            {filteredPledges.map((pledge) => (
              <div key={pledge.uniqname}>
                <PledgeTile pledge={pledge.uniqname} fetchPledges={fetchPledges} />
              </div>
            ))}
            {isAdmin && (
              <NewPledgeTile fetchPledges={fetchPledges}></NewPledgeTile>
            )}
          </div>

        </div>
      </div>

    </div>
  );
};
