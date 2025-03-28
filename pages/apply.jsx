import { useEffect, useState, useCallback } from 'react'
import supabase from '../supabase'
import dayjs from 'dayjs'
import imageCompression from 'browser-image-compression'
import Cropper from 'react-easy-crop'
import getCroppedImg from '../utils/cropImageHelper'

import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)

export default function Application () {
  const [session, setSession] = useState(null)
  const [isUmichEmail, setIsUmichEmail] = useState(false)
  const [userId, setUserId] = useState(null)

  // Application logic
  const [questions, setQuestions] = useState([])
  const [dueDate, setDueDate] = useState(null)
  const [isPastDue, setIsPastDue] = useState(false)
  const [startDate, setStartDate] = useState(null)
  const [isBeforeStart, setIsBeforeStart] = useState(true)

  // Personal info
  const [firstname, setFirstname] = useState('')
  const [lastname, setLastname] = useState('')
  const [major, setMajor] = useState('')
  const [year, setYear] = useState('')
  const [pronouns, setPronouns] = useState('')
  const [answers, setAnswers] = useState({})

  // Keep track of lastUpdated from the DB
  const [lastUpdated, setLastUpdated] = useState(null)

  // Photo / Crop
  const [profileImageFile, setProfileImageFile] = useState(null)
  const [croppingImageUrl, setCroppingImageUrl] = useState(null)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)

  // Track any photo changes (new file OR crop/zoom changed)
  const [photoChanged, setPhotoChanged] = useState(false)

  // ─────────────────────────────────────────────────────────
  // 1. Listen to Auth Changes (Session)
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession)
      }
    )
    return () => subscription.subscription.unsubscribe()
  }, [])

  // ─────────────────────────────────────────────────────────
  // 2. Check if email is @umich.edu, sign out if not
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (session?.user?.email) {
      const email = session.user.email.toLowerCase()
      if (email.endsWith('@umich.edu')) {
        setIsUmichEmail(true)
        setUserId(email.split('@')[0])
      } else {
        setIsUmichEmail(false)
        alert('You must use a @umich.edu email to apply.')
        supabase.auth.signOut()
      }
    }
  }, [session])

  // ─────────────────────────────────────────────────────────
  // 2b. If user is signed in, fetch existing profile image
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchExistingImage = async () => {
      if (!userId) return
      const { data: ImageData, error } = await supabase.storage
        .from('rushees')
        .download(`${userId}.jpeg`)

      // If they already have an uploaded image, show it
      if (!error && ImageData) {
        const urlObject = URL.createObjectURL(ImageData)
        setCroppingImageUrl(urlObject)
        setProfileImageFile(urlObject)
      }
    }
    fetchExistingImage()
  }, [userId])

  // ─────────────────────────────────────────────────────────
  // 3. If signed in, fetch app settings + questions + user data
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!session || !isUmichEmail) return

    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from('RushInfo')
        .select('*')
        .single()
      if (!error && data) {
        const due = dayjs(data.app_due_date).startOf('day')
        const start = dayjs(data.app_start_date).startOf('day')
        const annArborToday = dayjs().tz('America/New_York').startOf('day')

        setDueDate(due)
        setStartDate(start)
        setIsPastDue(annArborToday.isAfter(due))
        setIsBeforeStart(annArborToday.isBefore(start))
      }
    }
    fetchSettings()

    const fetchQuestions = async () => {
      const { data, error } = await supabase
        .from('Application_Questions')
        .select('*')
        .order('id', { ascending: true })
      if (!error && data) setQuestions(data)
    }

    const fetchUserData = async () => {
      // Personal info from "Rushees"
      const { data: userData } = await supabase
        .from('Rushees')
        .select('*')
        .eq('uniqname', userId)
        .single()

      if (userData) {
        setFirstname(userData.firstname || '')
        setLastname(userData.lastname || '')
        setMajor(userData.major || '')
        setYear(userData.year || '')
        setPronouns(userData.pronouns || '')
        if (userData.updated_at) {
          setLastUpdated(userData.updated_at)
        }
      }

      // Answers from "Application_Answers"
      const { data: answersData } = await supabase
        .from('Application_Answers')
        .select('*')
        .eq('uniqname', userId)

      if (answersData) {
        const mapped = {}
        answersData.forEach(a => {
          mapped[a.question_id] = a.answer
        })
        setAnswers(mapped)
      }
    }

    fetchQuestions()
    fetchUserData()
  }, [session, isUmichEmail, userId])

  // ─────────────────────────────────────────────────────────
  // 4. Auth / Submissions
  // ─────────────────────────────────────────────────────────
  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/apply` }
    })
    if (error) console.error('Error signing in:', error)
  }

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) console.error('SignOut Error:', error)
  }

  const handlePersonalInfoChange = e => {
    const { name, value } = e.target
    if (name === 'firstname') setFirstname(value)
    else if (name === 'lastname') setLastname(value)
    else if (name === 'major') setMajor(value)
    else if (name === 'year') setYear(value)
    else if (name === 'pronouns') setPronouns(value)
  }

  const handleAnswerChange = (qID, newVal) => {
    setAnswers(prev => ({ ...prev, [qID]: newVal }))
  }

  // ─────────────────────────────────────────────────────────
  // 5. Photo / Crop Handlers
  // ─────────────────────────────────────────────────────────

  // If the user picks a new file from disk:
  const handleImageSelect = e => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.includes('image')) {
      alert('Please select an image file!')
      return
    }
    const url = URL.createObjectURL(file)
    setCroppingImageUrl(url)
    setProfileImageFile(file)
    setPhotoChanged(true)
  }

  // We mark "photoChanged" true if user changes crop/zoom as well.
  const onCropComplete = useCallback((_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels)
    setPhotoChanged(true)
  }, [])

  const onCropChange = useCallback(newCrop => {
    setCrop(newCrop)
    // Optional: can set photoChanged here, but typically set it in onCropComplete
  }, [])

  const handleZoomChange = newZoom => {
    setZoom(newZoom)
    setPhotoChanged(true)
  }

  // ─────────────────────────────────────────────────────────
  // 6. Submit the entire form (including possibly recropped photo)
  // ─────────────────────────────────────────────────────────
  const handleSubmit = async e => {
    e.preventDefault()
    if (isPastDue) {
      alert('Application deadline has passed.')
      return
    }

    try {
      // If there's a cropping image and the user changed something
      // (new file OR changed zoom/crop), then recrop & upload:
      if (croppingImageUrl && photoChanged && croppedAreaPixels) {
        // 1) Crop
        const croppedBlob = await getCroppedImg(
          croppingImageUrl,
          croppedAreaPixels
        )

        // 2) Compress
        const options = {
          maxSizeMB: 0.03,
          maxWidthOrHeight: 1000,
          useWebWorker: true
        }
        const compressedFile = await imageCompression(croppedBlob, options)

        // 3) Upload
        await uploadProfilePhoto(compressedFile)
      }

      // Next, upsert personal info
      const { data: upsertData, error: upsertError } = await supabase
        .from('Rushees')
        .upsert(
          {
            uniqname: userId,
            firstname,
            lastname,
            major,
            year,
            pronouns,
            updated_at: new Date()
          },
          { onConflict: 'uniqname' }
        )
        .select('*')
        .single()

      if (upsertError) {
        console.error('Error upserting personal info:', upsertError)
        alert('Could not save. See console.')
        return
      } else if (upsertData?.updated_at) {
        setLastUpdated(upsertData.updated_at)
      }

      // Upsert answers
      const updates = questions.map(q => ({
        question_id: q.id,
        uniqname: userId,
        answer: answers[q.id] || ''
      }))

      const { error: ansError } = await supabase
        .from('Application_Answers')
        .upsert(updates, { onConflict: 'question_id, uniqname' })

      if (ansError) {
        console.error('Error saving answers:', ansError)
        alert('Could not save. See console.')
        return
      }

      // If everything succeeded:
      alert('Application saved!')
      setPhotoChanged(false) // Reset
    } catch (err) {
      console.error('Unexpected error while saving:', err)
      alert('Unexpected error while saving. Check console for details.')
    }
  }

  async function uploadProfilePhoto (file) {
    if (!session?.user) return
    const fileName = `${userId}.jpeg`
    const { error } = await supabase.storage
      .from('rushees')
      .upload(fileName, file, {
        cacheControl: '3600',
        contentType: 'image/jpeg',
        upsert: true
      })

    if (error) {
      console.error('Error uploading photo:', error.message)
      throw error
    }
  }

  // ─────────────────────────────────────────────────────────
  // 7. Rendering
  // ─────────────────────────────────────────────────────────

  // If not signed in
  if (!session) {
    return (
      <div className='container mx-auto p-4 max-w-lg'>
        <h1 className='text-2xl font-bold mb-4'>Application</h1>
        <p>Please sign in with your @umich.edu account.</p>
        <button
          onClick={handleGoogleSignIn}
          className='bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mt-3'
        >
          Sign in with Google
        </button>
      </div>
    )
  }

  // If domain isn’t umich
  if (!isUmichEmail) {
    return (
      <div className='container mx-auto p-4 max-w-lg'>
        <h1 className='text-2xl font-bold mb-4'>Invalid Email Domain</h1>
        <p>You must be signed in with @umich.edu to view this application.</p>
        <button
          onClick={handleSignOut}
          className='bg-gray-400 px-4 py-2 rounded mt-3'
        >
          Sign Out
        </button>
      </div>
    )
  }

  // If before start date
  if (isBeforeStart) {
    return (
      <div>
        <h1 className='text-2xl font-bold mb-4'>Application</h1>
        <p>Application is not open yet.</p>
        {startDate ? (
          <p>Please check back on {dayjs(startDate).format('MMMM D, YYYY')}</p>
        ) : (
          <p>Please check back soon for more info...</p>
        )}
        <button
          onClick={handleSignOut}
          className='bg-gray-400 px-4 py-2 rounded mt-3'
        >
          Sign Out
        </button>
      </div>
    )
  }

  // If past due and no submission
  if (isPastDue && lastUpdated === null) {
    return (
      <div>
        <h1 className='text-2xl font-bold mb-4'>Application</h1>
        <p>Application has closed. Please check back next semester!</p>
        <button
          onClick={handleSignOut}
          className='bg-gray-400 px-4 py-2 rounded mt-3'
        >
          Sign Out
        </button>
      </div>
    )
  }

  // If user is properly signed in & domain is umich
  return (
    <div className='container mx-auto p-4 max-w-4xl'>
      {/* Header */}
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-3xl font-bold'>Application</h1>
        <button
          onClick={handleSignOut}
          className='bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600'
        >
          Sign Out
        </button>
      </div>

      <div>
      Hello! Welcome to the Theta Tau rush application! Please be sure to fill
        out and submit all of the following sections before the due date. There
        is a section for general info about yourself, a place to upload a
        profile picture, and some application questions. Your application will
        only be considered if ALL of the sections are filled in before the due
        date. Please note that if you do not click "Save Application," and you
        close the tab, your progress will not be saved, but you can save/update
        your application as many times as you wish before the due date.
      </div>

      {/* Due Date */}
      {dueDate && (
        <div className='mb-4 text-gray-700'>
          <span className='font-semibold'>Due Date:</span>{' '}
          {dayjs(dueDate).format('MMMM D, YYYY')}
        </div>
      )}
      {isPastDue && (
        <p className='text-red-600 mb-4'>
          Application deadline has passed. You can no longer update your
          answers.
        </p>
      )}

      <form onSubmit={handleSubmit} className='space-y-6'>
        {/* Personal Info & Photo Section */}
        <div className='bg-gray-100 p-4 rounded shadow-sm'>
          <div className='flex flex-col md:flex-row gap-6'>
            {/* Photo Upload / Crop */}
            <div className='w-full md:w-1/2 flex flex-col items-center'>
              {/* Show existing/cropped profile image if available */}
              {croppingImageUrl && isPastDue ? (
                <div className='relative w-48 h-48 bg-gray-200 overflow-hidden rounded-full'>
                  <img
                    src={croppingImageUrl}
                    alt='Profile'
                    className='w-full h-full object-cover rounded-full'
                  />
                </div>
              ) : (
                isPastDue && <p>No profile photo uploaded.</p>
              )}

              {/* Only allow new file selection if not past due */}
              {!isPastDue && (
                <div className='mt-2'>
                  <label className='bg-blue-500 text-white px-3 py-2 rounded cursor-pointer'>
                    Select Photo (JPEG ONLY)
                    <input
                      type='file'
                      accept='image/jpeg'
                      className='hidden'
                      onChange={handleImageSelect}
                      disabled={isPastDue}
                    />
                  </label>
                </div>
              )}

              {/* Show cropping UI if we have an image and not past due */}
              {croppingImageUrl && !isPastDue && (
                <div className='relative w-48 h-48 bg-gray-200 overflow-hidden rounded-full mt-3'>
                  <Cropper
                    image={croppingImageUrl}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    cropShape='round'
                    showGrid={false}
                    onCropChange={onCropChange}
                    onZoomChange={handleZoomChange}
                    onCropComplete={onCropComplete}
                  />
                </div>
              )}

              {/* Zoom slider */}
              {croppingImageUrl && !isPastDue && (
                <div className='mt-2 flex flex-col items-center'>
                  <label>Zoom</label>
                  <input
                    type='range'
                    min={1}
                    max={3}
                    step={0.1}
                    value={zoom}
                    onChange={e => handleZoomChange(Number(e.target.value))}
                    className='w-40'
                  />
                </div>
              )}
            </div>

            {/* Personal Info Fields */}
            <div className='w-full md:w-1/2 space-y-4'>
              <div className='flex flex-col'>
                <label className='font-semibold mb-1'>First Name</label>
                <input
                  type='text'
                  name='firstname'
                  value={firstname}
                  onChange={handlePersonalInfoChange}
                  disabled={isPastDue}
                  className='border p-2 rounded max-w-sm'
                />
              </div>
              <div className='flex flex-col'>
                <label className='font-semibold mb-1'>Last Name</label>
                <input
                  type='text'
                  name='lastname'
                  value={lastname}
                  onChange={handlePersonalInfoChange}
                  disabled={isPastDue}
                  className='border p-2 rounded max-w-sm'
                />
              </div>
              <div className='flex flex-col'>
                <label className='font-semibold mb-1'>Major</label>
                <input
                  type='text'
                  name='major'
                  value={major}
                  onChange={handlePersonalInfoChange}
                  disabled={isPastDue}
                  className='border p-2 rounded max-w-sm'
                />
              </div>
              <div className='flex flex-col'>
                <label className='font-semibold mb-1'>Grad Year</label>
                <input
                  type='text'
                  name='year'
                  value={year}
                  onChange={handlePersonalInfoChange}
                  disabled={isPastDue}
                  className='border p-2 rounded max-w-sm'
                />
              </div>
              <div className='flex flex-col'>
                <label className='font-semibold mb-1'>Pronouns</label>
                <input
                  type='text'
                  name='pronouns'
                  value={pronouns}
                  onChange={handlePersonalInfoChange}
                  disabled={isPastDue}
                  className='border p-2 rounded max-w-sm'
                />
              </div>
            </div>
          </div>
        </div>

        {/* QUESTIONS SECTION */}
        <div className='bg-gray-100 p-4 rounded shadow-sm'>
          <h2 className='font-semibold text-lg mb-3'>Questions</h2>
          {questions.map(q => (
            <div key={q.id} className='mb-4'>
              <p className='font-semibold mb-1'>{q.question}</p>
              <textarea
                rows={4}
                className='border rounded p-2 w-full whitespace-pre-wrap break-words break-all'
                value={answers[q.id] || ''}
                disabled={isPastDue}
                onChange={e => handleAnswerChange(q.id, e.target.value)}
              />
            </div>
          ))}
        </div>

        {/* SUBMIT BUTTON + LAST UPDATED */}
        <div className='flex items-center gap-4'>
          {!isPastDue && (
            <button
              type='submit'
              className='bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700'
            >
              Save Application
            </button>
          )}
          {lastUpdated && (
            <span className='text-gray-600 text-sm'>
              Last updated:{' '}
              {dayjs(lastUpdated).format('MMM D, YYYY h:mm A')}
            </span>
          )}
        </div>
      </form>
    </div>
  )
}
