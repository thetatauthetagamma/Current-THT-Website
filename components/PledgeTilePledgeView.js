import React, { useEffect, useState } from 'react'
import ProgressBar from '@ramonak/react-progress-bar'
import thtlogo from '../public/tht-logo.png'
import Image from 'next/image'
import supabase from '../supabase'
import moment from 'moment-timezone'

// Keep these specific imports from your constants:
import {
  requirementDueDate,
  numAcademicHours,
  numSocialHours
} from '../constants/pledgeConstants'

const PledgeTilePledgeView = ({ pledge }) => {
  // array of brother emails who pledge has interviewed:
  const [interviews, setInterviews] = useState(pledge.interviews)
  // array of brother firstname/lastname who pledge has interviewed:
  const [interviewedBrothers, setInterviewedBrothers] = useState([])

  // number of PD signoffs completed
  const [pdCompletedCount, setPDCompletedCount] = useState(0)
  // all PD signoffs for this pledge (each row from Pledge_SignOffs + Pledge_Requirements)
  const [pdSignOffs, setPDSignOffs] = useState([])
  // all PD requirements from the DB
  const [pdRequirements, setPDRequirements] = useState([])

  // number of committee signoffs completed
  const [committeeCompletedCount, setCommitteeCompletedCount] = useState(0)
  // all committee signoffs for this pledge
  const [committeeSignOffs, setCommitteeSignOffs] = useState([])
  // all committee requirements from the DB
  const [committeeRequirements, setCommitteeRequirements] = useState([])

  // Pledge Info
  const [firstname, setFirstname] = useState('')
  const [userID, setUserID] = useState('')
  const [socialHours, setSocialHours] = useState(0)
  const [academicHours, setAcademicHours] = useState(0)

  // interview counts
  const [numInterviews, setNumInterviews] = useState(0)

  // countdown to due date
  const [countdown, setCountdown] = useState('')

  // ============================
  //  Get user session + pledge details
  // ============================
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const session = await supabase.auth.getSession()
        if (session) {
          setUserID(session.data.session?.user.email || '')
        }
      } catch (error) {
        console.error('Error fetching session', error)
        setUserID('')
      }
    }
    fetchSession()
  }, [])

  // Fetch the Pledge’s row from the “Pledges” table
  async function fetchPledgeDetails() {
    try {
      const { data, error } = await supabase
        .from('Pledges')
        .select('*')
        .eq('uniqname', pledge)
        .single()

      if (error) throw error
      if (data) {
        setFirstname(data.firstname)
        setInterviews(data.interviews || [])
        setNumInterviews(data.interviews ? data.interviews.length : 0)
        setAcademicHours(data.academicHours || 0)
        setSocialHours(data.socialHours || 0)
      }
    } catch (error) {
      console.error('Error fetching pledge details:', error)
    }
  }

  // ============================
  //  Interview Brothers
  // ============================
  async function fetchInterviewedBrothers() {
    if (!interviews || interviews.length === 0) {
      setInterviewedBrothers([])
      return
    }
    try {
      const { data, error } = await supabase
        .from('Brothers')
        .select('firstname, lastname')
        .in('email', interviews)

      if (error) throw error
      if (data) {
        setInterviewedBrothers(data)
        setNumInterviews(data.length)
      }
    } catch (error) {
      console.error('Error fetching interviewed brothers:', error)
    }
  }

  useEffect(() => {
    fetchInterviewedBrothers()
  }, [interviews])

  useEffect(() => {
    fetchPledgeDetails()
  }, [userID])

  // ============================
  //  PD & Committee Requirements from DB
  // ============================
  async function fetchPDRequirements() {
    try {
      const { data, error } = await supabase
        .from('Pledge_Requirements')
        .select('*')
        .eq('type', 'pd')
      if (error) throw error
      setPDRequirements(data || [])
    } catch (err) {
      console.error('Error fetching PD requirements:', err)
    }
  }

  async function fetchCommitteeRequirements() {
    try {
      const { data, error } = await supabase
        .from('Pledge_Requirements')
        .select('*')
        .eq('type', 'committee')
      if (error) throw error
      setCommitteeRequirements(data || [])
    } catch (err) {
      console.error('Error fetching committee requirements:', err)
    }
  }

  // ============================
  //  Pledge SignOffs for PD / Committee
  // ============================
  async function fetchPledgePDSignoffs() {
    try {
      const { data, error } = await supabase
        .from('Pledge_SignOffs')
        .select(`
          id,
          completed,
          Pledge_Requirements: Pledge_Requirements!inner(*)
        `)
        .eq('uniqname', pledge)
        .eq('Pledge_Requirements.type', 'pd')

      if (error) throw error

      setPDSignOffs(data || [])
      // Count how many are completed
      const count = data.filter(item => item.completed).length
      setPDCompletedCount(count)
    } catch (err) {
      console.error('Error fetching PD signoffs:', err)
    }
  }

  async function fetchPledgeCommitteeSignoffs() {
    try {
      const { data, error } = await supabase
        .from('Pledge_SignOffs')
        .select(`
          id,
          completed,
          Pledge_Requirements: Pledge_Requirements!inner(*)
        `)
        .eq('uniqname', pledge)
        .eq('Pledge_Requirements.type', 'committee')

      if (error) throw error

      setCommitteeSignOffs(data || [])
      // Count how many are completed
      const count = data.filter(item => item.completed).length
      setCommitteeCompletedCount(count)
    } catch (err) {
      console.error('Error fetching committee signoffs:', err)
    }
  }

  // Kick off requirement + signoff fetches
  useEffect(() => {
    fetchPDRequirements()
    fetchCommitteeRequirements()
  }, [])

  useEffect(() => {
    fetchPledgePDSignoffs()
    fetchPledgeCommitteeSignoffs()
  }, [userID])

  // ============================
  //  Countdown to due date
  // ============================
  useEffect(() => {
    const interval = setInterval(() => {
      const now = moment().tz('America/Detroit').startOf('day')
      const eventDate = moment
        .tz(requirementDueDate, 'YYYY-MM-DD', 'America/Detroit')
        .startOf('day')

      const remainingTime = eventDate.diff(now, 'days') // diff in days
      setCountdown(remainingTime)
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // ============================
  //  Render
  // ============================
  return (
    <div className=' bg-gray-100 p-2 rounded-2xl mb-4 px-4 flex flex-col items-start flex-start'>
      <div className='flex font-bold text-4xl lg:text-6xl py-4'>
        Welcome {firstname}!
      </div>
      <div className='flex flex-wrap font-bold md:text-xl lg:text-4xl pb-4 text-xl'>
        You have
        <div className='inline-flex border-2 border-[#8b0000] rounded px-2 ml-2 mr-2'>
          {countdown}
        </div>
        days until pledge requirements are due.
      </div>

      {/* INTERVIEWS */}
      <div className='pb-6 w-full'>
        <div className='text-lg'>
          {numInterviews < 30 ? (
            <>
              You have completed {numInterviews} interviews. You have{' '}
              {30 - numInterviews} interviews remaining.
            </>
          ) : (
            <>
              You have completed {numInterviews} interviews. You have 0
              interviews remaining.
            </>
          )}
        </div>
        <ProgressBar
          className='w-full py-2'
          completed={Math.round((Math.min(numInterviews, 30) * 100) / 30)}
          bgColor='#22c55e'
          height='40px'
        />
        <div>Brothers Interviewed:</div>
        <div className='flex flex-wrap gap-2'>
          {interviewedBrothers.map((brother, idx) => (
            <div
              key={idx}
              className='border-2 border-gray-400 rounded p-1 mt-2 text-center transition-transform transform-gpu hover:scale-105 hover:border-[#8b0000]'
            >
              {brother.firstname} {brother.lastname}
            </div>
          ))}
        </div>
      </div>

      {/* COMMITTEE SIGNOFFS */}
      <div className='pb-6 w-full border-t-2 border-[#a3000020] pt-1'>
        <div className='text-lg'>
          You have completed {committeeCompletedCount} committee sign offs. You have{' '}
          {committeeRequirements.length - committeeCompletedCount} sign offs remaining.
        </div>
        <ProgressBar
          className='w-full py-2'
          completed={Math.round(
            (committeeCompletedCount * 100) / committeeRequirements.length
          )}
          bgColor='#22c55e'
          height='40px'
        />
        <div className='pt-2'>
          Sign Offs:
          <div>
            {committeeRequirements.map((req) => {
              // see if there's a signoff for this requirement
              const signoff = committeeSignOffs.find(
                (so) => so.Pledge_Requirements.id === req.id
              )
              const isCompleted = signoff?.completed || false

              return (
                <div key={req.id} className='flex items-center space-x-2'>
                  <input
                    type='checkbox'
                    checked={isCompleted}
                    readOnly
                    className='rounded accent-[#8b0000] p-2'
                  />
                  <label>{req.requirement}</label>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* PD SIGNOFFS */}
      <div className='w-full pb-6 border-t-2 border-[#a3000020] pt-1'>
        <div className='text-lg '>
          You have completed {pdCompletedCount} professional development sign offs. You have{' '}
          {pdRequirements.length - pdCompletedCount} sign offs remaining.
        </div>
        <ProgressBar
          className='w-full py-2'
          completed={Math.round(
            (pdCompletedCount * 100) / pdRequirements.length
          )}
          bgColor='#22c55e'
          height='40px'
        />
        <div className='pt-2'>
          Sign Offs:
          <div>
            {pdRequirements.map((req) => {
              const signoff = pdSignOffs.find(
                (so) => so.Pledge_Requirements.id === req.id
              )
              const isCompleted = signoff?.completed || false

              return (
                <div key={req.id} className='flex items-center space-x-2'>
                  <input
                    type='checkbox'
                    checked={isCompleted}
                    readOnly
                    className='rounded accent-[#8b0000] p-2'
                  />
                  <label>{req.requirement}</label>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* HOURS */}
      <div className='w-full pb-6 border-t-2 border-[#a3000020] pt-1'>
        <div className='text-lg '>
          You have completed {socialHours} social hours and {academicHours}{' '}
          academic hours. You have{' '}
          {numSocialHours + numAcademicHours - socialHours - academicHours} hours remaining.
        </div>
        <ProgressBar
          className='w-full py-2'
          completed={Math.round(
            ((academicHours + socialHours) * 100) /
              (numSocialHours + numAcademicHours)
          )}
          bgColor='#22c55e'
          height='40px'
        />
      </div>
    </div>
  )
}

export default PledgeTilePledgeView
