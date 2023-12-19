import { NextPage } from "next";
import { useEffect, useState } from "react";
import supabase from "../../supabase";
import DateTimePicker from 'react-datetime-picker';
import {google} from 'googleapis';
import Link from 'next/link';
import PledgeTile from '../../components/PledgeTile'
import BroNavBar from "@/components/BroNavBar";
const BroResources: NextPage = () => {


  

  return (
    <div className="flex md:flex-row flex-col flex-grow border-b-2 border-[#a3000020]">
    
    <BroNavBar/>
    
    <ul className="space-y-2 font-bold w-full text-lg xs:max-sm:flex xs:max-sm:flex-col xs:max-sm:items-center pl-8">
      <h1 className="font-bold text-4xl py-4">Resources</h1>
          <li className="hover:bg-gray-200 transition-colors duration-300 rounded flex-grow ">
            <a href="https://docs.google.com/forms/d/e/1FAIpQLSeyJg3VlVoX7AR3f-EfA4vJX8MHbtOJ85uHEtqIcsbgwioADQ/viewform?usp=sf_link" target="_blank" className="block p-2 rounded">📋 Attendance Form</a>
          </li>
          <li className="hover:bg-gray-200 transition-colors duration-300 rounded  flex-grow">
            <a href="https://docs.google.com/forms/d/e/1FAIpQLSc7QPoP5UA1oDnnF5sv3MNziBuBXrKwknyuTJz4Iu8rV9fSzw/viewform?usp=sf_link" target="_blank" className="block p-2 rounded">📝 Fraternity Feedback Form</a>
          </li>
          <li className="hover:bg-gray-200 transition-colors duration-300 rounded  flex-grow">
            <a href="https://docs.google.com/forms/d/e/1FAIpQLSesDE-9LlYp97ZynLmKOVEn9UaTVVMdVZP36vRYDtjarOifsA/viewform?usp=sf_link" target="_blank" className="block p-2 rounded">📝 EBoard Feedback Form</a>
          </li>
          <li className="hover:bg-gray-200 transition-colors duration-300 rounded  flex-grow">
            <a href="https://docs.google.com/forms/d/e/1FAIpQLSeXFsB9u0jzLG83rmDiPWynPQgRHBgk6V1hTC6a8fi6iW2aJw/viewform" target="_blank" className="block p-2 rounded">📝 Risk Manager Feedback Form</a>
          </li>
          <li className="hover:bg-gray-200 transition-colors duration-300 rounded  flex-grow">
            <a href="https://docs.google.com/forms/d/e/1FAIpQLSf0r2ESFIBakxZSL_dCAV9CrAQjwo0KUrG-Ac_lBvRHZyzc_w/viewform" target="_blank" className="block p-2 rounded">👶 Pledge Feedback Form</a>
          </li>
          <li className="hover:bg-gray-200 transition-colors duration-300 rounded flex-grow">
            <a href="https://docs.google.com/forms/d/e/1FAIpQLSfBGJTqwIAoKUeJt81nheVrPapZNrJUBBFC3wyxrbhrKGLVTA/viewform" target="_blank" className="block p-2 rounded">🚑 Brother of Concer (Risk) Form</a>
          </li>
          <li className="hover:bg-gray-200 transition-colors duration-300 rounded flex-grow">
            <a href="https://docs.google.com/forms/d/e/1FAIpQLSds1eiHaU_qxOcZpDUExtrCbg2dIBpXpxeC-H6VhKwYgzKwng/viewform" target="_blank" className="block p-2 rounded">💰 Reimbursement Form</a>
          </li>
    </ul>
</div>
  )
}


export default function ProtectedDashboard() {

  const [isBrother, setIsBrother] = useState(false)
  const [userEmail, setUserEmail] = useState('');
  
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const session = await supabase.auth.getSession();
        if (session) {
          setUserEmail(session.data.session?.user.email || '')
        }
      } catch (error) {
        console.log(error);
      }
    };

    fetchSession();
  }, []);

  useEffect(() => {
    const checkIfBrother = async () => {
      if (userEmail) { // Check if userEmail is not empty
        const { data, error } = await supabase.from('Brothers').select('*').eq('email', userEmail);
        if (data?.length === 1 && !error) {
          setIsBrother(true);
        }
      }
    }
  
    checkIfBrother();
  }, [userEmail]);
  

  return (
    <>
      <BroResources />
    </>
  )
}