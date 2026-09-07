import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import supabase from '@/supabase'
import Head from 'next/head'
import type { Session } from '@supabase/supabase-js'

interface RushEvent {
  id: number
  name: string
  date: string
  location: string | null
  description: string | null
  open: boolean
  attendance: boolean
  attendance_key: string | null
}

export default function AttendancePage() {
  const router = useRouter()
  const { eventId } = router.query
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [event, setEvent] = useState<RushEvent | null>(null)
  const [isUmichEmail, setIsUmichEmail] = useState(false)
  const [attendanceRecorded, setAttendanceRecorded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recording, setRecording] = useState(false)

  // Helper function to check if attendance can still be taken
  const canTakeAttendance = (eventDate: string | null): { allowed: boolean; message?: string } => {
    // If no date specified, attendance can be taken anytime
    if (!eventDate) {
      return { allowed: true }
    }

    try {
      const eventDateObj = new Date(eventDate)
      const today = new Date()
      
      // Set to end of day for the event (23:59:59.999)
      const eventEndOfDay = new Date(eventDateObj)
      eventEndOfDay.setHours(23, 59, 59, 999)
      
      // Set to end of day for today
      const todayEndOfDay = new Date(today)
      todayEndOfDay.setHours(23, 59, 59, 999)
      
      // Check if today is after the end of the event day
      if (todayEndOfDay > eventEndOfDay) {
        const eventDateStr = eventDateObj.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
        return {
          allowed: false,
          message: `Attendance can only be taken until the end of the event day (${eventDateStr}).`
        }
      }
      
      return { allowed: true }
    } catch (err) {
      console.error('Error parsing event date:', err)
      // If date parsing fails, allow attendance (fail open)
      return { allowed: true }
    }
  }

  // Check session on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession)
      }
    )
    return () => subscription.subscription.unsubscribe()
  }, [])

  // Check if email is @umich.edu
  useEffect(() => {
    if (session?.user?.email) {
      const email = session.user.email.toLowerCase()
      if (email.endsWith('@umich.edu')) {
        setIsUmichEmail(true)
      } else {
        setIsUmichEmail(false)
      }
    }
  }, [session])


  // Fetch event details
  useEffect(() => {
    if (!eventId) return

    const fetchEvent = async () => {
      try {
        // Look up event by attendance_key only
        const { data, error } = await supabase
          .from('RushEvents')
          .select('*')
          .eq('attendance_key', eventId)
          .single()

        if (error) {
          console.error('Error fetching event:', error)
          setError('Event not found')
          return
        }

        // Check if attendance is enabled for this event
        if (data && !data.attendance) {
          setError('Attendance is not enabled for this event.')
          setEvent(data) // Still set event so we can display it
          return
        }

        // Check if attendance can still be taken (date validation)
        if (data) {
          const dateCheck = canTakeAttendance(data.date)
          if (!dateCheck.allowed) {
            setError(dateCheck.message || 'Attendance deadline has passed.')
            setEvent(data) // Still set event so we can display it
            return
          }
        }

        setEvent(data)
      } catch (err) {
        console.error('Error fetching event:', err)
        setError('Failed to load event')
      }
    }

    fetchEvent()
  }, [eventId, router])

  // Record attendance when user is logged in with valid email
  useEffect(() => {
    if (!session || !isUmichEmail || !event || attendanceRecorded || recording || error) return

    const recordAttendance = async () => {
      // Check if attendance can still be taken (date validation)
      const dateCheck = canTakeAttendance(event.date)
      if (!dateCheck.allowed) {
        setError(dateCheck.message || 'Attendance deadline has passed.')
        return
      }

      setRecording(true)
      const email = session.user.email?.toLowerCase()
      if (!email) {
        setError('No email found in session')
        setRecording(false)
        return
      }
      const uniqname = email.split('@')[0]

      try {
        // Upsert attendance - insert or update if exists
        // First check if record exists
        const { data: existing, error: checkError } = await supabase
          .from('Rushee_Attendance')
          .select('id')
          .eq('uniqname', uniqname)
          .eq('event_id', event.id)
          .maybeSingle()

        if (checkError && checkError.code !== 'PGRST116') {
          // Error other than "no rows found"
          console.error('Error checking existing attendance:', checkError)
          setError('Failed to record attendance. Please try again.')
          setRecording(false)
          return
        }

        if (existing) {
          // Update existing record
          const { error: updateError } = await supabase
            .from('Rushee_Attendance')
            .update({
              event_name: event.name, // Update event name in case it changed
            })
            .eq('id', existing.id)

          if (updateError) {
            console.error('Error updating attendance:', updateError)
            setError('Failed to record attendance. Please try again.')
            setRecording(false)
            return
          }
        } else {
          // Let the DB assign the ID via its serial/identity column
          const { error: insertError } = await supabase
            .from('Rushee_Attendance')
            .insert({
              uniqname: uniqname,
              event_id: event.id,
              event_name: event.name,
            })

          if (insertError) {
            console.error('Error inserting attendance:', insertError)
            setError('Failed to record attendance. Please try again.')
            setRecording(false)
            return
          }
        }

        // Success - attendance recorded
        setAttendanceRecorded(true)
        setRecording(false)
      } catch (err) {
        console.error('Error recording attendance:', err)
        setError('Failed to record attendance. Please try again.')
        setRecording(false)
      }
    }

    recordAttendance()
  }, [session, isUmichEmail, event, attendanceRecorded])

  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/attendance/${eventId}` }
    })
    if (error) {
      console.error('Error signing in:', error)
      setError('Failed to sign in. Please try again.')
    }
  }

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) console.error('SignOut Error:', error)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-xl font-semibold text-[#8B0000] mb-2">Loading...</div>
        </div>
      </div>
    )
  }

  if (!event && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-xl font-semibold text-[#8B0000] mb-2">Loading event...</div>
        </div>
      </div>
    )
  }

  if (error && !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-md">
          <div className="text-xl font-semibold text-red-600 mb-2">Error</div>
          <div className="text-gray-700 mb-4">{error}</div>
          <button
            onClick={() => router.push('/')}
            className="bg-[#8B0000] text-white px-4 py-2 rounded hover:bg-red-800"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  // Check if attendance is disabled for this event
  if (event && !event.attendance) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Head>
          <title>Attendance Disabled - {event.name}</title>
        </Head>
        <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-md">
          <div className="text-xl font-semibold text-red-600 mb-2">Attendance Not Available</div>
          <div className="mb-4">
            <div className="text-lg font-semibold text-gray-800 mb-2">{event.name}</div>
            <div className="text-gray-700">Attendance is not enabled for this event.</div>
          </div>
          <button
            onClick={() => router.push('/')}
            className="bg-[#8B0000] text-white px-4 py-2 rounded hover:bg-red-800"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  // Not signed in
  if (!session) {
    // Check if attendance deadline has passed
    const dateCheck = event ? canTakeAttendance(event.date) : { allowed: true }
    
    if (event && !dateCheck.allowed) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Head>
            <title>Attendance Closed - {event.name}</title>
          </Head>
          <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-md">
            <div className="text-xl font-semibold text-red-600 mb-2">Attendance Closed</div>
            <div className="mb-4">
              <div className="text-lg font-semibold text-gray-800 mb-2">{event.name}</div>
              <div className="text-gray-700">{dateCheck.message || 'Attendance deadline has passed.'}</div>
            </div>
            <button
              onClick={() => router.push('/')}
              className="bg-[#8B0000] text-white px-4 py-2 rounded hover:bg-red-800"
            >
              Go Home
            </button>
          </div>
        </div>
      )
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Head>
          <title>Attendance - {event?.name || 'Event'}</title>
        </Head>
        <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-[#8B0000] mb-4">Event Attendance</h1>
          {event && (
            <div className="mb-4">
              <div className="text-lg font-semibold text-gray-800 mb-2">{event.name}</div>
              {event.location && (
                <div className="text-sm text-gray-600 mb-1">📍 {event.location}</div>
              )}
            </div>
          )}
          <p className="text-gray-700 mb-4">Please sign in with your @umich.edu account to mark your attendance.</p>
          <button
            onClick={handleGoogleSignIn}
            className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 font-semibold"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    )
  }

  // Not UMich email
  if (!isUmichEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Head>
          <title>Attendance - {event?.name || 'Event'}</title>
        </Head>
        <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Invalid Email Domain</h1>
          <p className="text-gray-700 mb-4">You must be signed in with a @umich.edu email to mark attendance.</p>
          <button
            onClick={handleSignOut}
            className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
          >
            Sign Out
          </button>
        </div>
      </div>
    )
  }

  // Recording attendance
  if (recording) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Head>
          <title>Recording Attendance - {event?.name || 'Event'}</title>
        </Head>
        <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-md">
          <div className="text-xl font-semibold text-[#8B0000] mb-2">Recording attendance...</div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B0000] mx-auto"></div>
        </div>
      </div>
    )
  }

  // Attendance recorded successfully
  if (attendanceRecorded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Head>
          <title>Attendance Recorded - {event?.name || 'Event'}</title>
        </Head>
        <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-md">
          <div className="text-4xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-green-600 mb-4">Attendance Recorded!</h1>
          {event && (
            <div className="mb-4">
              <div className="text-lg font-semibold text-gray-800 mb-2">{event.name}</div>
              <div className="text-sm text-gray-600">
                Your attendance has been successfully recorded.
              </div>
            </div>
          )}
          <button
            onClick={() => router.push('/')}
            className="bg-[#8B0000] text-white px-4 py-2 rounded hover:bg-red-800 mt-4"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Head>
          <title>Error - {event?.name || 'Event'}</title>
        </Head>
        <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-md">
          <div className="text-xl font-semibold text-red-600 mb-2">Error</div>
          <div className="text-gray-700 mb-4">{error}</div>
          <button
            onClick={() => router.push('/')}
            className="bg-[#8B0000] text-white px-4 py-2 rounded hover:bg-red-800"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  return null
}

