import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import ProgressBar from '@ramonak/react-progress-bar'
import Image from 'next/image'
import imageCompression from 'browser-image-compression'
import supabase from '../supabase'
import thtlogo from '../public/tht-logo.png'
import trash from '../public/trash-can.png'

// [Optional] If you still want these for default or static uses

// NextUI imports
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownSection,
  DropdownItem
} from '@nextui-org/react'
const PledgeTile = ({ pledge, fetchPledges }) => {
  const router = useRouter()
  const [interviews, setInterviews] = useState(pledge.interviews)
  const [interviewedBrothers, setInterviewedBrothers] = useState([])
  const [hasInterviewed, setHasInterviewed] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [newImage, setNewImage] = useState(null)

  // Pledge data
  const [firstname, setFirstname] = useState('')
  const [lastname, setLastname] = useState('')
  const [major, setMajor] = useState('')
  const [pronouns, setPronouns] = useState('')
  const [year, setYear] = useState('')

  // PD & Committee signoffs
  const [pd, setPD] = useState(0) // how many PD signoffs completed
  const [pdSOs, setpdSOs] = useState([])
  const [committeeSignOffs, setCommitteeSignOffs] = useState([])
  const [numCommitteeSOs, setnumCommitteeSOs] = useState(0)

  // Hours, roles, etc.
  const [socialHours, setSocialHours] = useState(0)
  const [academicHours, setAcademicHours] = useState(0)
  const [completed, setCompleted] = useState(0)
  // Instead of storing requirement strings for selected, we store the "id" of the selected requirement
  const [selectedCommittee, setSelectedCommittee] = useState('')
  const [selectedPDSO, setselectedPDSO] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [userID, setUserID] = useState('')

  // Requirements fetched from DB
  const [pdRequirements, setPDRequirements] = useState([]) // all PD requirements
  const [committeeRequirements, setCommitteeRequirements] = useState([]) // all committee requirements
  const [socialHoursRequired, setSocialHoursRequired] = useState(0)
  const [academicHoursRequired, setAcademicHoursRequired] = useState(0)
  const [interviewsRequired, setInterviewsRequired] = useState(0)

  // Editable fields
  const [editableFields, setEditableFields] = useState({
    academicHours: false,
    socialHours: false,
    imageUrl: false
  })

  // ==========================================================
  // FETCH SESSION, ADMIN ROLE, PLEDGE DETAILS, & IMAGE
  // ==========================================================
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const session = await supabase.auth.getSession()
        if (session) {
          setUserID(session.data.session?.user.email || '')
        }
      } catch (error) {
        console.error('Error fetching session:', error)
      }
    }
    fetchSession()
  }, [])

  useEffect(() => {
    fetchPledgeDetails()
    checkBrotherInPledge()
  }, [userID, editableFields])

  useEffect(() => {
    if (!userID) {
      return
    }
    const fetchAdminRole = async () => {
      try {
        const { data, error } = await supabase
          .from('Brothers')
          .select('adminrole')
          .eq('email', userID)
          .single()
        if (!error && data) {
          if (data.adminrole === 'parent' || data.adminrole === 'dev') {
            setIsAdmin(true)
          }
        }
      } catch (error) {
        console.error('Error fetching admin role:', error)
      }
    }
    fetchAdminRole()
  }, [userID])

  async function fetchPledgeDetails () {
    try {
      const { data, error } = await supabase
        .from('Pledges')
        .select('*')
        .eq('uniqname', pledge)
        .single()

      if (!error && data) {
        setFirstname(data.firstname)
        setLastname(data.lastname)
        setMajor(data.major)
        setPronouns(data.pronouns)
        setYear(data.year)
        setInterviews(data.interviews)
        setAcademicHours(data.academicHours || 0)
        setSocialHours(data.socialHours || 0)
      }
    } catch (err) {
      console.error('Error fetching pledge details:', err)
    }
  }

  // Fetch existing pledge image from Supabase Storage
  useEffect(() => {
    const fetchPledgeImage = async () => {
      if (!pledge) return
      try {
        const { data: ImageData, error } = await supabase.storage
          .from('pledges')
          .download(`${pledge}.jpeg`)

        if (!error && ImageData) {
          setImageUrl(URL.createObjectURL(ImageData))
        }
      } catch (err) {
        console.error('Error fetching pledge image:', err)
      }
    }
    fetchPledgeImage()
  }, [pledge])

  useEffect(() => {
    const fetchPledgeDetails = async () => {
      try {
        const { data, error } = await supabase
          .from('Pledge_Info')
          .select('*')
          .single()
          if (data) {
            setSocialHoursRequired(data.num_social_hours)
            setAcademicHoursRequired(data.num_academic_hours)
            setInterviewsRequired(data.num_interviews)
          }
      } catch (error) {
        console.error('Error fetching pledge requirement details:', error)
      }
      
    }
    fetchPledgeDetails()
  }, [])
  // ==========================================================
  // INTERVIEWS
  // ==========================================================
  useEffect(() => {
    fetchInterviewedBrothers()
  }, [interviews, userID])

  async function fetchInterviewedBrothers () {
    try {
      if (!interviews || interviews.length === 0) {
        setInterviewedBrothers([])
        return
      }
      const { data, error } = await supabase
        .from('Brothers')
        .select('firstname, lastname')
        .in('email', interviews)

      if (!error && data) {
        setInterviewedBrothers(data)
      }
    } catch (error) {
      console.error('Error fetching interviewed brothers:', error)
    }
  }

  async function checkBrotherInPledge () {
    if (!pledge) return
    try {
      const { data, error } = await supabase
        .from('Pledges')
        .select('uniqname, interviews')
        .eq('uniqname', pledge)
        .single()
  
      if (!error && data) {
        const { interviews: currentInts } = data
        if (currentInts && currentInts.includes(userID)) {
          setHasInterviewed(true)
        } else {
          setHasInterviewed(false)
        }
      }
    } catch (error) {
      console.error('Error checking brother interview:', error)
    }
  }

  const handleInterviewClick = async () => {
    try {
      // fetch existing interviews
      const { data, error } = await supabase
        .from('Pledges')
        .select('interviews')
        .eq('uniqname', pledge)
        .single()

      const currentInterviews = data?.interviews || []

      let updatedInterviews
      if (currentInterviews.includes(userID)) {
        // remove interview
        updatedInterviews = currentInterviews.filter(item => item !== userID)
        setHasInterviewed(false)
      } else {
        // add interview
        updatedInterviews = [...currentInterviews, userID]
        setHasInterviewed(true)
      }

      // update DB
      await supabase
        .from('Pledges')
        .upsert([{ uniqname: pledge, interviews: updatedInterviews }], {
          onConflict: 'uniqname'
        })

      setInterviews(updatedInterviews)
    } catch (error) {
      console.error('Error toggling interview:', error)
    }
  }

  // ==========================================================
  // IMAGE UPLOAD (WITH COMPRESSION)
  // ==========================================================
  const handleImageChange = async e => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      // Validate the file format (JPEG)
      if (file.type !== 'image/jpeg') {
        console.error('Invalid file format. Please select a JPEG image.')
        return
      }

      // Compress to ~30KB
      const options = {
        maxSizeMB: 0.03,
        maxWidthOrHeight: 1000,
        useWebWorker: true
      }
      const compressedFile = await imageCompression(file, options)

      // Set for immediate preview
      setNewImage(compressedFile)
      setImageUrl(URL.createObjectURL(compressedFile))
    } catch (err) {
      console.error('Error compressing image:', err)
    }
  }

  const handleImageSave = async () => {
    if (!newImage) return
    try {
      const fileName = `${pledge}.jpeg`
      const { error: uploadError } = await supabase.storage
        .from('pledges')
        .upload(fileName, newImage, {
          cacheControl: '3600',
          contentType: 'image/jpeg',
          upsert: true
        })

      if (!uploadError) {
        console.log('Profile photo uploaded successfully')
        setNewImage(null)
        alert('Image updated successfully.')
      } else {
        console.error('Error uploading image:', uploadError?.message)
      }
    } catch (err) {
      console.error('Error saving image:', err)
    }
  }

  // ==========================================================
  // PD & COMMITTEE REQUIREMENTS + SIGNOFFS
  // ==========================================================
  useEffect(() => {
    // 1) Get all PD requirements
    fetchPDSignOffRequirements()
    // 2) Get all committee requirements
    fetchCommitteeSignoffRequirements()
  }, [])

  // Re-fetch signoffs whenever the user picks a new requirement to sign off
  useEffect(() => {
    fetchPledgePDSignoffs()
    fetchPledgeCommitteeSignoffs()
  }, [selectedCommittee, selectedPDSO])

  async function fetchCommitteeSignoffRequirements () {
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

  async function fetchPDSignOffRequirements () {
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

  // Fetch the pledge's signoffs for committees
  async function fetchPledgeCommitteeSignoffs () {
    try {
      const { data, error } = await supabase
        .from('Pledge_SignOffs')
        .select(
          `
          id,
          completed,
          Pledge_Requirements: Pledge_Requirements!inner(*)
        `
        )
        .eq('uniqname', pledge)
        .eq('Pledge_Requirements.type', 'committee')

      if (error) throw error

      // data is an array of signoff records
      const signOffCount = data.filter(item => item.completed).length

      setCommitteeSignOffs(data)
      setnumCommitteeSOs(signOffCount)
    } catch (err) {
      console.error('Error fetching committee signoffs:', err)
    }
  }

  // Fetch the pledge's signoffs for PD
  async function fetchPledgePDSignoffs () {
    try {
      const { data, error } = await supabase
        .from('Pledge_SignOffs')
        .select(
          `
          id,
          completed,
          Pledge_Requirements: Pledge_Requirements!inner(*)
        `
        )
        .eq('uniqname', pledge)
        .eq('Pledge_Requirements.type', 'pd')

      if (error) throw error

      const pdSignOffCount = data.filter(item => item.completed).length
      setpdSOs(data)
      setPD(pdSignOffCount)
    } catch (err) {
      console.error('Error fetching PD signoffs:', err)
    }
  }

  // ==========================================================
  // PD & COMMITTEE SIGNOFF SUBMITS
  // ==========================================================
  async function handlePDSignOff () {
    try {
      if (!selectedPDSO) {
        console.error('Please select a PD requirement first.')
        return
      }

      // Upsert the signoff
      const { error: upsertError } = await supabase
        .from('Pledge_SignOffs')
        .upsert(
          [
            {
              uniqname: pledge,
              id: selectedPDSO,
              completed: true
            }
          ],
          { onConflict: ['uniqname', 'id'] }
        )

      if (upsertError) throw upsertError

      // Look up the actual requirement text from the DB
      const pdReqItem = pdRequirements.find(r => r.id === selectedPDSO)
      const reqTitle = pdReqItem
        ? pdReqItem.requirement
        : `Req #${selectedPDSO}`

      alert(`You have signed off ${pledge} for: ${reqTitle}.`)

      setselectedPDSO('')
      fetchPledgePDSignoffs()
    } catch (err) {
      console.error('Error with PD sign-off:', err)
    }
  }

  async function handleCommitteeSignOffSubmit () {
    try {
      if (!selectedCommittee) {
        console.error('Please select a committee requirement first.')
        return
      }

      const { error: upsertError } = await supabase
        .from('Pledge_SignOffs')
        .upsert(
          [
            {
              uniqname: pledge,
              id: selectedCommittee,
              completed: true
            }
          ],
          {
            onConflict: ['uniqname', 'id']
          }
        )

      if (upsertError) throw upsertError

      // Look up the requirement text from the DB
      const committeeReqItem = committeeRequirements.find(
        r => r.id === selectedCommittee
      )
      const reqTitle = committeeReqItem
        ? committeeReqItem.requirement
        : `Req #${selectedCommittee}`

      alert(`You have signed off pledge ${pledge} for: ${reqTitle}.`)

      setSelectedCommittee('')
      fetchPledgeCommitteeSignoffs()
    } catch (err) {
      console.error('Error with committee sign-off:', err)
    }
  }

  // ==========================================================
  // PROGRESS CALCULATION
  // ==========================================================
  useEffect(() => {
    const calculateProgress = () => {
      // For example, you might still want to cap at 30 interviews or 40 total hours:
      let interviewNum = interviews?.length || 0
      if (interviewNum > interviewsRequired) interviewNum = interviewsRequired

      let hoursNum = socialHours + academicHours
      if (hoursNum > socialHoursRequired + academicHoursRequired)
        hoursNum = socialHoursRequired + academicHoursRequired

      // Completed PD signoffs
      const pdCompleted = pd
      // Completed committee signoffs
      const committeeCompleted = numCommitteeSOs

      // The total number of PD requirements
      const pdTotalReqs = pdRequirements.length
      // The total number of committee requirements
      const committeeTotalReqs = committeeRequirements.length

      // For example, total denominator = 30 interviews + 40 hours + # PD reqs + # committee reqs
      const denominator =
        interviewsRequired +
        academicHoursRequired +
        socialHoursRequired +
        pdTotalReqs +
        committeeTotalReqs
      const numerator =
        interviewNum + hoursNum + pdCompleted + committeeCompleted

      const totalProgress = Math.round((numerator / denominator) * 100)
      setCompleted(totalProgress)
    }
    calculateProgress()
  }, [
    interviews,
    pd,
    numCommitteeSOs,
    socialHours,
    academicHours,
    pdRequirements,
    committeeRequirements
  ])

  // ==========================================================
  // EDIT / SAVE ADMIN
  // ==========================================================
  const handleFieldEdit = () => {
    setEditableFields(prev => ({
      ...prev,
      academicHours: !prev.academicHours,
      socialHours: !prev.socialHours,
      imageUrl: !prev.imageUrl
    }))
  }

  const handleSave = async () => {
    try {
      // Update hours in the DB
      const { error } = await supabase
        .from('Pledges')
        .update({ academicHours, socialHours })
        .eq('uniqname', pledge)

      if (error) throw error

      // Optionally reset editable fields
      setEditableFields({
        academicHours: false,
        socialHours: false,
        imageUrl: false
      })
      console.log('Pledge hours updated successfully')
    } catch (err) {
      console.error('Error updating pledge:', err)
    }
  }

  // ==========================================================
  // DELETE PLEDGE
  // ==========================================================
  const handleDeletePledge = async () => {
    const isConfirmed = window.confirm(
      'Are you sure you want to delete this pledge? All data will be removed.'
    )
    if (!isConfirmed) return

    try {
      // Delete from main Pledges table
      const { error } = await supabase
        .from('Pledges')
        .delete()
        .eq('uniqname', pledge)
      if (error) throw error

      // Also remove signoffs from Pledge_SignOffs
      await supabase.from('Pledge_SignOffs').delete().eq('uniqname', pledge)

      fetchPledges()
    } catch (err) {
      console.error('Error deleting pledge:', err)
    }
  }

  // ==========================================================
  // Handle click to navigate to pledge profile
  const handlePledgeClick = () => {
    router.push(`/members/${pledge}`)
  }

  // RENDER
  // ==========================================================
  return (
    <div 
      className='flex flex-col md:flex-row items-center bg-white p-6 rounded-xl shadow-md border border-gray-200 mb-4 cursor-pointer hover:shadow-lg hover:border-[#8B0000]/30 transition-all duration-300 hover:scale-[1.01]'
      onClick={handlePledgeClick}
    >
      {/* LEFT COLUMN: IMAGE + BASIC INFO + ADMIN EDIT */}
      <div className='flex flex-col items-center md:w-3/12'>
        {/* Profile image */}
        <div className='mb-4 w-40 h-40'>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt='Pledge'
              className='rounded-full w-full h-full object-cover shadow-lg'
            />
          ) : (
            <Image
              src={thtlogo}
              alt='logo'
              className='rounded-full w-full h-full object-cover shadow-lg'
            />
          )}
        </div>

        {/* Admin can upload & save image */}
        {isAdmin && editableFields.imageUrl && (
          <div className='w-full flex justify-center'>
            <label className='cursor-pointer bg-[#8B0000] py-2 text-white mx-1 rounded-lg text-center px-4 font-medium hover:bg-[#8B0000]/90 transition-colors shadow-md'>
              Upload photo (JPEG only)
              <input
                type='file'
                accept='image/*'
                onChange={handleImageChange}
                className='hidden'
              />
            </label>
            {newImage && (
              <button
                className='bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 hover:scale-105 ml-2 font-medium shadow-md transition-all duration-200'
                onClick={(e) => {
                  e.stopPropagation()
                  handleImageSave()
                }}
              >
                Save Image
              </button>
            )}
          </div>
        )}

        {/* Basic info */}
        <div className='text-center mt-2'>
          <p className='font-bold'>
            {firstname} {lastname}
          </p>
          <p>
            {year} | {pronouns} | {major}
          </p>

          {/* Admin Edit / Delete / Save Buttons */}
          {isAdmin && (
            <div className='flex flex-col md:flex-row items-center justify-evenly w-full'>
              {!Object.values(editableFields).some(field => field) ? (
                <button
                  className='font-bold m-2 text-md bg-[#8B0000] p-3 rounded-lg text-center text-white hover:bg-[#8B0000]/90 transition-colors shadow-md'
                  onClick={(e) => {
                    e.stopPropagation()
                    handleFieldEdit()
                  }}
                >
                  Edit
                </button>
              ) : (
                <div className='flex flex-row m-2 items-center'>
                  <button
                    className='font-bold mr-2 text-md bg-red-500 p-3 rounded-lg text-center h-12 text-white hover:bg-red-600 transition-colors shadow-md'
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeletePledge()
                    }}
                  >
                    <Image
                      src={trash}
                      alt='Delete'
                      className='rounded-full w-full h-full object-cover'
                    />
                  </button>
                  <button
                    className='font-bold mr-2 text-md bg-gray-500 p-3 rounded-lg text-center text-white hover:bg-gray-600 transition-colors shadow-md'
                    onClick={(e) => {
                      e.stopPropagation()
                      handleFieldEdit()
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className='font-bold text-md bg-green-500 p-3 rounded-lg text-center text-white hover:bg-green-600 transition-colors shadow-md'
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSave()
                    }}
                  >
                    Save
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: STATS, SIGNOFFS, PROGRESS BAR, ETC. */}
      <div className='flex flex-col items-center w-9/12'>
        {/* Stats Row */}
        <div className='flex flex-col md:flex-row items-center justify-evenly w-full pb-2'>
          <div className='flex flex-col items-center p-2'>
            <p className='text-sm font-bold mb-1'># of Interviews</p>
            <p className='text-sm'>{interviews?.length || 0}</p>
          </div>
          <div className='flex flex-col items-center md:border-x-2 border-black p-2'>
            <p className='text-sm text-center font-bold mb-1'>
              # of PD Activities
            </p>
            <p className='text-sm'>{pd}</p>
          </div>
          <div className='flex flex-col items-center p-2'>
            <p className='text-sm text-center font-bold mb-1'>
              # of Committee Signoffs
            </p>
            <p className='text-sm'>{numCommitteeSOs}</p>
          </div>
          <div className='flex flex-col items-center md:border-x-2 border-black p-2'>
            <p className='text-sm text-center font-bold mb-1'>
              # of Social Hours
            </p>
            <p className='text-sm'>
              {editableFields.socialHours && isAdmin ? (
                <input
                  type='text'
                  placeholder={socialHours}
                  value={socialHours}
                  onChange={e => setSocialHours(parseInt(e.target.value) || 0)}
                  className='whitespace-nowrap w-20 text-center border-2 border-[#8b000070]'
                />
              ) : (
                socialHours
              )}
            </p>
          </div>
          <div className='flex flex-col items-center p-2'>
            <p className='text-sm text-center font-bold mb-1'>
              # of Academic Hours
            </p>
            <p className='text-sm'>
              {editableFields.academicHours && isAdmin ? (
                <input
                  type='text'
                  placeholder={academicHours}
                  value={academicHours}
                  onChange={e =>
                    setAcademicHours(parseInt(e.target.value) || 0)
                  }
                  className='whitespace-nowrap w-20 text-center border-2 border-[#8b000070]'
                />
              ) : (
                academicHours
              )}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className='flex flex-col items-center w-full p-2'>
          <ProgressBar
            className='w-full'
            completed={completed}
            bgColor='#22c55e'
            height='40px'
          />
        </div>

        {/* Buttons for Interviews, PD, Committee Signoffs */}
        <div className='flex flex-col md:flex-row items-center m-4 w-full justify-evenly'>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleInterviewClick()
            }}
            className={`flex-start ${
              hasInterviewed ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
            } text-white py-3 px-4 rounded-lg flex flex-col items-center m-2 justify-center md:w-1/4 hover:scale-105 transition-all duration-200 font-medium shadow-md`}
          >
            {hasInterviewed
              ? `${firstname} has interviewed me`
              : `${firstname} has not interviewed me`}
          </button>

          {/* PD Signoff */}
          <div className='flex items-center justify-center m-2 md:w-1/3'>
            <Dropdown>
              <DropdownTrigger>
                <button className='bg-gray-500 text-white p-2 rounded-md'>
                  {selectedPDSO
                    ? // Show the text of the currently‐selected requirement
                      pdRequirements.find(r => r.id === selectedPDSO)
                        ?.requirement || `Req #${selectedPDSO}`
                    : 'Select PD Activity ▼'}
                </button>
              </DropdownTrigger>
              <DropdownMenu className='bg-white shadow-lg rounded-md z-50'>
                {pdRequirements.map(req => {
                  const signoff = pdSOs.find(
                    so => so.Pledge_Requirements.id === req.id
                  )
                  if (signoff && signoff.completed) {
                    return null
                  }
                  return (
                    <DropdownItem
                      key={req.id}
                      onClick={() => setselectedPDSO(req.id)}
                      className='bg-gray-100 hover:bg-gray-200 p-2 rounded-md transition-colors'
                    >
                      {req.requirement || `Req #${req.id}`}
                    </DropdownItem>
                  )
                })}
              </DropdownMenu>
            </Dropdown>

            <button
              onClick={(e) => {
                e.stopPropagation()
                handlePDSignOff()
              }}
              className='ml-2 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 hover:scale-105 transition-all duration-200 font-medium shadow-md'
            >
              Submit
            </button>
          </div>

          {/* Committee Signoff */}
          <div className='flex items-center justify-center m-2 md:w-1/3'>
            <Dropdown>
              <DropdownTrigger>
                <button className='bg-gray-500 text-white p-2 rounded-md'>
                  {selectedCommittee
                    ? committeeRequirements.find(
                        r => r.id === selectedCommittee
                      )?.requirement || `Req #${selectedCommittee}`
                    : 'Select Committee ▼'}
                </button>
              </DropdownTrigger>
              <DropdownMenu className='bg-white shadow-lg rounded-md z-50'>
                {committeeRequirements.map(req => {
                  const signoff = committeeSignOffs.find(
                    so => so.Pledge_Requirements.id === req.id
                  )
                  if (signoff && signoff.completed) {
                    return null
                  }

                  return (
                    <DropdownItem
                      key={req.id}
                      onClick={() => setSelectedCommittee(req.id)}
                      className='bg-gray-100 hover:bg-gray-200 p-2 rounded-md transition-colors'
                    >
                      {req.requirement || `Req #${req.id}`}
                    </DropdownItem>
                  )
                })}
              </DropdownMenu>
            </Dropdown>

            <button
              onClick={(e) => {
                e.stopPropagation()
                handleCommitteeSignOffSubmit()
              }}
              className='ml-2 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 hover:scale-105 transition-all duration-200 font-medium shadow-md'
            >
              Submit
            </button>
          </div>
        </div>

        {/* Brothers Interviewed (Admin Only) */}
        {isAdmin && interviewedBrothers && (
          <div className='flex flex-col items-start w-full mt-2'>
            <div className='text-base font-semibold'>Brothers Interviewed:</div>
            <div className='flex flex-wrap gap-2 mt-2'>
              {interviewedBrothers.map((brother, idx) => (
                <div
                  key={idx}
                  className='border-2 border-gray-400 rounded p-1 text-center transition-transform transform-gpu hover:scale-105 hover:border-[#8b0000]'
                >
                  {brother.firstname} {brother.lastname}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PledgeTile
