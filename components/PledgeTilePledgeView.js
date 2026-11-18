import React, { useEffect, useState } from 'react'
import ProgressBar from '@ramonak/react-progress-bar'
import thtlogo from '../public/tht-logo.png'
import Image from 'next/image'
import { daysUntilDue } from '../utils/daysUntilDue'
import supabase from '../supabase'

// Keep these specific imports from your constants:
// import {
//   requirementDueDate,
//   numAcademicHours,
//   numSocialHours
// } from '../constants/pledgeConstants'

const PledgeTilePledgeView = ({ pledge }) => {
  // array of brother emails who pledge has interviewed:
  const [interviews, setInterviews] = useState(pledge?.interviews || [])
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

  const [requirementDueDate, setRequirementDueDate] = useState('')
  const [numSocialHoursRequired, setNumSocialHoursRequired] = useState(0)
  const [numAcademicHoursRequired, setNumAcademicHoursRequired] = useState(0) 
  const [interviewsRequired, setInterviewsRequired] = useState(0)
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

  useEffect(() => {
    const fetchPledgeDetails = async () => {
      try {
        const { data, error } = await supabase
          .from('Pledge_Info')
          .select('*')
          .single()
          if (data) {
            setNumSocialHoursRequired(data.num_social_hours)
            setNumAcademicHoursRequired(data.num_academic_hours)
            setInterviewsRequired(data.num_interviews)
            setRequirementDueDate(data.requirement_due_date)
          }
      } catch (error) {
        console.error('Error fetching pledge requirement details:', error)
      }
      
    }
    fetchPledgeDetails()
  }, [])
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
  }, [pledge]) // was [userID, pledge]: ran twice per visit

  // ============================
  //  PD & Committee Requirements from DB
  // ============================
  async function fetchPDRequirements() {
    try {
      const { data, error } = await supabase
        .from('Pledge_Requirements_Update')
        .select('*')
        .eq('type', 'PD')
      if (error) throw error
      setPDRequirements(data || [])
    } catch (err) {
      console.error('Error fetching PD requirements:', err)
      setPDRequirements([])
    }
  }

  async function fetchCommitteeRequirements() {
    try {
      const { data, error } = await supabase
        .from('Pledge_Requirements_Update')
        .select('*')
        .eq('type', 'COMMITTEE')
      if (error) throw error
      setCommitteeRequirements(data || [])
    } catch (err) {
      console.error('Error fetching committee requirements:', err)
      setCommitteeRequirements([])
    }
  }

  // Validate signoffs - ensures each ID exists in the requirements table
  function validateSignoffs(signoffIds, pdReqs = pdRequirements, committeeReqs = committeeRequirements) {
    if (!Array.isArray(signoffIds) || signoffIds.length === 0) return []

    // Build set of all valid requirement IDs from both PD and Committee
    const allReqIds = new Set(
      [...pdReqs, ...committeeReqs]
        .map(r => Number(r.id))
        .filter(n => Number.isFinite(n))
    )

    // If requirements aren't loaded yet, return original (don't filter)
    if (allReqIds.size === 0) {
      return signoffIds.map(Number).filter(n => Number.isFinite(n))
    }

    // Filter to only IDs that exist in the requirements table
    const normalized = signoffIds.map(Number).filter(n => Number.isFinite(n))
    return normalized.filter(id => allReqIds.has(id))
  }

  // Clean signoffs ONCE after both fetches complete - removes any IDs that don't exist in requirements table
  async function validateAndCleanSignoffsOnce() {
    try {
      // Only clean if we have BOTH requirement types loaded
      if (pdRequirements.length === 0 || committeeRequirements.length === 0) {
        return
      }

      // Fetch current signoffs
      const { data: pledgeData, error: pledgeError } = await supabase
        .from('Pledges')
        .select('signoffs')
        .eq('uniqname', pledge)
        .single()

      if (pledgeError) {
        console.error('Error fetching signoffs for validation:', pledgeError)
        return
      }

      const signoffIds = pledgeData?.signoffs || []
      const validSignoffs = validateSignoffs(signoffIds, pdRequirements, committeeRequirements)
      const normalized = signoffIds.map(Number).filter(n => Number.isFinite(n))
      const invalidSignoffs = normalized.filter(id => !validSignoffs.includes(id))

      // Only update DB if we found invalid IDs (IDs that don't exist in requirements table)
      if (invalidSignoffs.length > 0) {
        const { error: updateError } = await supabase
          .from('Pledges')
          .update({ signoffs: validSignoffs })
          .eq('uniqname', pledge)

        if (updateError) {
          console.error('Error cleaning invalid signoffs:', updateError)
        } else {
          // Re-fetch after cleaning to update UI
          await fetchPledgeSignoffs()
        }
      }
    } catch (err) {
      console.error('Error in validateAndCleanSignoffsOnce:', err)
    }
  }

  // ============================
  //  Pledge SignOffs for PD / Committee
  // ============================
  // One query feeds both lists (it used to read the same Pledges row twice per refresh).
  async function fetchPledgeSignoffs() {
    try {
      const { data: pledgeData, error: pledgeError } = await supabase
        .from('Pledges')
        .select('signoffs')
        .eq('uniqname', pledge)
        .single()

      if (pledgeError) throw pledgeError

      // Validate signoffs (don't write to DB here - that happens in validateAndCleanSignoffsOnce)
      const validSignoffIds = validateSignoffs(pledgeData?.signoffs || [])

      const pdReqIdSet = new Set(pdRequirements.map(r => Number(r.id)).filter(n => Number.isFinite(n)))
      const committeeReqIdSet = new Set(committeeRequirements.map(r => Number(r.id)).filter(n => Number.isFinite(n)))
      const pdSignoffIds = validSignoffIds.filter(id => pdReqIdSet.has(Number(id)))
      const committeeSignoffIds = validSignoffIds.filter(id => committeeReqIdSet.has(Number(id)))

      setPDSignOffs(pdSignoffIds.map(id => ({ id })))
      setPDCompletedCount(pdSignoffIds.length)
      setCommitteeSignOffs(committeeSignoffIds.map(id => ({ id })))
      setCommitteeCompletedCount(committeeSignoffIds.length)
    } catch (err) {
      console.error('Error fetching signoffs:', err)
      setPDSignOffs([]); setPDCompletedCount(0)
      setCommitteeSignOffs([]); setCommitteeCompletedCount(0)
    }
  }

  // Kick off requirement + signoff fetches
  useEffect(() => {
    fetchPDRequirements()
    fetchCommitteeRequirements()
  }, [])

  // Fetch signoffs once BOTH requirements are loaded to avoid race conditions
  useEffect(() => {
    if (pdRequirements.length > 0 && committeeRequirements.length > 0) {
      // Fetch both signoffs together to avoid race conditions
      fetchPledgeSignoffs().then(() => {
        // After both fetch, validate and clean signoffs ONCE
        validateAndCleanSignoffsOnce()
      })
    }
  }, [userID, pledge, pdRequirements, committeeRequirements])

  // Refresh signoffs periodically and when page comes into focus (without validation to avoid overwrites)
  useEffect(() => {
    // Only set up periodic refresh if requirements are loaded
    if (pdRequirements.length === 0 || committeeRequirements.length === 0) {
      return
    }

    // Refresh every 30s while the tab is visible (was every 5s even in the background), and whenever you come back to it.
    const refresh = () => { if (document.visibilityState === 'visible') fetchPledgeSignoffs() }
    const interval = setInterval(refresh, 30000)
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)

    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [pledge, pdRequirements, committeeRequirements])

  // ============================
  //  Countdown to due date
  // ============================
  useEffect(() => {
    const update = () => {
      const days = daysUntilDue(requirementDueDate)
      setCountdown(days === null ? '--' : days)
    }
    update() // immediately, not after a 1s delay
    const interval = setInterval(update, 60000) // the value only changes at midnight; once a minute is plenty
    return () => clearInterval(interval)
  }, [requirementDueDate])

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
        days until potential new member requirements are due.
      </div>

      {/* INTERVIEWS */}
      <div className='pb-6 w-full'>
        <div className='text-lg'>
          {numInterviews < interviewsRequired ? (
            <>
              You have completed {numInterviews} interviews. You have{' '}
              {interviewsRequired - numInterviews} interviews remaining.
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
          completed={interviewsRequired > 0 
            ? Math.round((Math.min(numInterviews, interviewsRequired) * 100) / interviewsRequired)
            : 0}
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
          completed={committeeRequirements.length > 0
            ? Math.round((committeeCompletedCount * 100) / committeeRequirements.length)
            : 0}
          bgColor='#22c55e'
          height='40px'
        />
        <div className='pt-2'>
          Sign Offs:
          <div>
            {committeeRequirements.map((req) => {
              // Check if this requirement is signed off
              const isCompleted = committeeSignOffs.some(so => so.id === req.id)

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
          completed={pdRequirements.length > 0
            ? Math.round((pdCompletedCount * 100) / pdRequirements.length)
            : 0}
          bgColor='#22c55e'
          height='40px'
        />
        <div className='pt-2'>
          Sign Offs:
          <div>
            {pdRequirements.map((req) => {
              // Check if this requirement is signed off
              const isCompleted = pdSignOffs.some(so => so.id === req.id)

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
          {numSocialHoursRequired + numAcademicHoursRequired - socialHours - academicHours} hours remaining.
        </div>
        <ProgressBar
          className='w-full py-2'
          completed={(numSocialHoursRequired + numAcademicHoursRequired) > 0
            ? Math.round(((academicHours + socialHours) * 100) / (numSocialHoursRequired + numAcademicHoursRequired))
            : 0}
          bgColor='#22c55e'
          height='40px'
        />
      </div>
    </div>
  )
}

export default PledgeTilePledgeView
