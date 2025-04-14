import React, { useState, useEffect } from 'react'
import supabase from '@/supabase'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

export default function PledgeAdminPanel() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [userID, setUserID] = useState('')

  // The single row from Pledge_Info (or null if none)
  const [pledgeInfo, setPledgeInfo] = useState(null)

  // Form fields
  const [dueDate, setDueDate] = useState(null)
  const [numSocialHours, setNumSocialHours] = useState(0)
  const [numAcademicHours, setNumAcademicHours] = useState(0)
  const [numInterviews, setNumInterviews] = useState(0)

  // ─────────────────────────────────────────────────────────
  // 1) CHECK USER SESSION & ROLE
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    fetchSession()
  }, [])

  async function fetchSession() {
    try {
      const session = await supabase.auth.getSession()
      if (session.data?.session?.user?.email) {
        setUserID(session.data.session.user.email)
        checkAdminRole(session.data.session.user.email)
      }
    } catch (error) {
      console.error('Error fetching session:', error)
    }
  }

  async function checkAdminRole(email) {
    try {
      const { data, error } = await supabase
        .from('Brothers')
        .select('adminrole')
        .eq('email', email)
        .single()

      if (!error && data) {
        if (data.adminrole === 'parent' || data.adminrole === 'dev') {
          setIsAdmin(true)
        }
      }
    } catch (error) {
      console.error('Error checking admin role:', error)
    }
  }

  // ─────────────────────────────────────────────────────────
  // 2) FETCH OR CREATE/UPDATE THE Pledge_Info ROW
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (isAdmin) {
      fetchPledgeInfo()
    }
  }, [isAdmin])

  async function fetchPledgeInfo() {
    try {
      // We assume only 1 row in Pledge_Info (singleton).
      const { data, error } = await supabase
        .from('Pledge_Info')
        .select('*')
        .single()

      if (error) {
        console.log('No existing Pledge_Info row found or error:', error.message)
        setPledgeInfo(null)
        return
      }
      // If found, store it
      setPledgeInfo(data)

      // Convert DB fields to local state
      if (data.requirement_due_date) {
        // parse into a JS Date
        setDueDate(new Date(data.requirement_due_date))
      }
      setNumSocialHours(data.num_social_hours || 0)
      setNumAcademicHours(data.num_academic_hours || 0)
      setNumInterviews(data.num_interviews || 0)
    } catch (err) {
      console.error('Error fetching pledge info:', err)
    }
  }

  async function handleCreatePledgeInfo() {
    try {
      // Convert date to YYYY-MM-DD or ISO
      const dateValue = dueDate
        ? dueDate.toISOString() // e.g. "2025-04-14T04:00:00.000Z"
        : null

      // Insert
      const { data, error } = await supabase
        .from('Pledge_Info')
        .insert([
          {
            requirement_due_date: dateValue,
            num_social_hours: numSocialHours,
            num_academic_hours: numAcademicHours,
            num_interviews: numInterviews
          }
        ])
        .select('*')
        .single()

      if (error) {
        throw error
      }
      alert('Pledge Info created successfully!')
      setPledgeInfo(data)
    } catch (err) {
      console.error('Error creating Pledge_Info:', err)
      alert('Failed to create row in Pledge_Info.')
    }
  }

  async function handleSavePledgeInfo() {
    if (!pledgeInfo) return

    try {
      const dateValue = dueDate
        ? dueDate.toISOString()
        : null

      const { data, error } = await supabase
        .from('Pledge_Info')
        .update({
          requirement_due_date: dateValue,
          num_social_hours: numSocialHours,
          num_academic_hours: numAcademicHours,
          num_interviews: numInterviews
        })
        .eq('id', pledgeInfo.id)
        .select('*')
        .single()

      if (error) {
        throw error
      }
      alert('Pledge Info updated successfully!')
      setPledgeInfo(data)
    } catch (err) {
      console.error('Error updating Pledge_Info:', err)
      alert('Failed to update row in Pledge_Info.')
    }
  }

  // ─────────────────────────────────────────────────────────
  // 3) RENDER
  // ─────────────────────────────────────────────────────────
  if (!isAdmin) {
    return (
      <div className="bg-white rounded-md shadow-md p-4 w-full">
        <h2 className="text-2xl font-bold mb-2 text-[#8B0000]">
          Pledge Info
        </h2>
        <p>You are not authorized to view this panel.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-md shadow-md p-4 w-full">
      <h2 className="text-2xl font-bold mb-6 text-[#8B0000]">
        Pledge Info Admin
      </h2>

      {/* If no row in Pledge_Info, allow user to insert one */}
      {!pledgeInfo ? (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <h3 className="text-lg font-semibold mb-4">No Pledge_Info Found</h3>
          <p className="mb-4 text-gray-600">
            Create a new Pledge_Info entry by selecting a due date and specifying the total hours/interviews.
          </p>

          <div className="mt-4 space-y-4">
            <div>
              <label className="block font-medium mb-1">Requirement Due Date:</label>
              <DatePicker
                selected={dueDate}
                onChange={(date) => setDueDate(date)}
                dateFormat="yyyy-MM-dd"
                placeholderText="Select date"
                className="border rounded p-1 w-full"
              />
            </div>

            <div>
              <label className="block font-medium mb-1">Number of Social Hours Required:</label>
              <input
                type="number"
                value={numSocialHours}
                onChange={(e) => setNumSocialHours(parseInt(e.target.value) || 0)}
                className="border rounded p-1 w-full"
              />
            </div>

            <div>
              <label className="block font-medium mb-1">Number of Academic Hours Required:</label>
              <input
                type="number"
                value={numAcademicHours}
                onChange={(e) => setNumAcademicHours(parseInt(e.target.value) || 0)}
                className="border rounded p-1 w-full"
              />
            </div>

            <div>
              <label className="block font-medium mb-1">Number of Interviews Required:</label>
              <input
                type="number"
                value={numInterviews}
                onChange={(e) => setNumInterviews(parseInt(e.target.value) || 0)}
                className="border rounded p-1 w-full"
              />
            </div>

            <button
              onClick={handleCreatePledgeInfo}
              className="mt-4 bg-[#8B0000] text-white px-4 py-2 rounded hover:bg-red-800"
            >
              Create Pledge Info
            </button>
          </div>
        </div>
      ) : (
        // If we do have a row in Pledge_Info, show the edit form
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <h3 className="text-lg font-semibold mb-4">Edit Pledge Requirement Info</h3>
          <div className="mt-2 space-y-4">
            <div>
              <label className="block font-medium mb-1">Requirement Due Date:</label>
              <DatePicker
                selected={dueDate}
                onChange={(date) => setDueDate(date)}
                dateFormat="yyyy-MM-dd"
                className="border rounded p-1 w-full"
              />
            </div>

            <div>
              <label className="block font-medium mb-1">Number of Social Hours Required:</label>
              <input
                type="number"
                value={numSocialHours}
                onChange={(e) => setNumSocialHours(parseInt(e.target.value) || 0)}
                className="border rounded p-1 w-full"
              />
            </div>

            <div>
              <label className="block font-medium mb-1">Number of Academic Hours Required:</label>
              <input
                type="number"
                value={numAcademicHours}
                onChange={(e) => setNumAcademicHours(parseInt(e.target.value) || 0)}
                className="border rounded p-1 w-full"
              />
            </div>

            <div>
              <label className="block font-medium mb-1">Number of Interviews Required:</label>
              <input
                type="number"
                value={numInterviews}
                onChange={(e) => setNumInterviews(parseInt(e.target.value) || 0)}
                className="border rounded p-1 w-full"
              />
            </div>
          </div>

          <button
            onClick={handleSavePledgeInfo}
            className="mt-4 bg-[#8B0000] text-white px-4 py-2 rounded hover:bg-red-800"
          >
            Save Pledge Info
          </button>
        </div>
      )}
    </div>
  )
}
