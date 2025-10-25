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
    <div className="flex md:flex-row flex-col flex-grow border-b-2 border-[#a3000020] bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <BroNavBar isPledge={false} />
      <div className="flex-grow">
        <div className="flex-grow h-full p-6">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="font-bold text-5xl text-gray-800 mb-2 text-center md:text-left">
              Pledge Progress
            </h1>
            <p className="text-gray-600 text-lg text-center md:text-left">
              Track and manage pledge progress and requirements
            </p>
          </div>

          {/* Feedback Form Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  📝 PNM Feedback Form
                </h3>
                <p className="text-gray-600">
                  Share your thoughts about potential new members
                </p>
              </div>
              <a
                href="https://forms.gle/SM3GDZzfLDXgfhDz6"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg"
              >
                👶 Fill Out Form
              </a>
            </div>
          </div>

          {/* Search Section */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Search Pledges</h3>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by pledge name or uniqname..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-4 pl-12 border-2 border-gray-200 rounded-lg focus:border-[#8B0000] focus:ring-2 focus:ring-[#8B0000]/20 transition-all duration-200 text-lg"
              />
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                🔍
              </div>
            </div>
            {searchQuery && (
              <p className="text-sm text-gray-600 mt-2">
                Showing {filteredPledges.length} of {pledges.length} pledges
              </p>
            )}
          </div>

          {/* Pledges Grid */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800">
                Pledge Directory
              </h3>
              <div className="text-sm text-gray-600">
                {filteredPledges.length} pledge{filteredPledges.length !== 1 ? 's' : ''}
              </div>
            </div>
            
            <div 
              className="space-y-4 max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
              style={{ 
                scrollbarWidth: 'thin',
                scrollbarColor: '#d1d5db #f3f4f6'
              }}
            >
              {filteredPledges.map((pledge) => (
                <div key={pledge.uniqname} className="transform transition-all duration-200 hover:scale-[1.02]">
                  <PledgeTile pledge={pledge.uniqname} fetchPledges={fetchPledges} />
                </div>
              ))}
              {isAdmin && (
                <div className="transform transition-all duration-200 hover:scale-[1.02]">
                  <NewPledgeTile fetchPledges={fetchPledges} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
