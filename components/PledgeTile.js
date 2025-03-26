import React, { useEffect, useState } from 'react'
import ProgressBar from '@ramonak/react-progress-bar'
import Image from 'next/image'
import imageCompression from 'browser-image-compression' // 1) IMPORT
import supabase from '../supabase'
import thtlogo from '../public/tht-logo.png'
import trash from '../public/trash-can.png'

import { pdRequirementList, committeeList, numAcademicHours, numSocialHours } from '../constants/pledgeConstants'
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownSection,
  DropdownItem
} from '@nextui-org/react'

const PledgeTile = ({ pledge, fetchPledges }) => {
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
  const [pd, setPD] = useState(0)
  const [pdSOs, setpdSOs] = useState([])
  const [committeeSignOffs, setCommitteeSignOffs] = useState([])
  const [numCommitteeSOs, setnumCommitteeSOs] = useState(0)

  // Hours, roles, etc.
  const [socialHours, setSocialHours] = useState(0)
  const [academicHours, setAcademicHours] = useState(0)
  const [completed, setCompleted] = useState(0)
  const [selectedCommittee, setSelectedCommittee] = useState('')
  const [selectedPDSO, setselectedPDSO] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [userID, setUserID] = useState('')

  // Which fields are editable?
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

  async function fetchPledgeDetails() {
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

  // ==========================================================
  // INTERVIEWS
  // ==========================================================
  useEffect(() => {
    fetchInterviewedBrothers()
  }, [interviews, userID])

  async function fetchInterviewedBrothers() {
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

  async function checkBrotherInPledge() {
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
        .upsert(
          [{ uniqname: pledge, interviews: updatedInterviews }],
          { onConflict: 'uniqname' }
        )

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
  // PD & COMMITTEE SIGNOFFS
  // ==========================================================
  useEffect(() => {
    fetchCommitteeSignoffs()
    fetchPDSignoffs()
  }, [selectedCommittee, selectedPDSO])

  async function fetchCommitteeSignoffs() {
    try {
      const { data, error } = await supabase
        .from('CommitteeSignOffs')
        .select('*')
        .eq('pledge', pledge)

      if (data && data.length > 0) {
        const signOffCount = Object.values(data[0]).filter(val => val === true).length
        setCommitteeSignOffs(data)
        setnumCommitteeSOs(signOffCount)
      }
    } catch (err) {
      console.error('Error fetching committee signoffs:', err)
    }
  }

  async function fetchPDSignoffs() {
    try {
      const { data, error } = await supabase
        .from('PDSignOffs')
        .select('*')
        .eq('pledge', pledge)

      if (data && data.length > 0) {
        const pdSignOffCount = Object.values(data[0]).filter(val => val === true).length
        setpdSOs(data)
        setPD(pdSignOffCount)
      }
    } catch (err) {
      console.error('Error fetching PD signoffs:', err)
    }
  }

  const handleCommitteeSignOffSubmit = async () => {
    try {
      if (!selectedCommittee) {
        console.error('Please select a committee')
        return
      }

      // Upsert the relevant committee field to true
      const { error } = await supabase
        .from('CommitteeSignOffs')
        .upsert(
          [{ pledge, [selectedCommittee]: true }],
          { onConflict: ['pledge'] }
        )
      if (error) throw error

      // Now add the brother to the sign-off array
      const { data: existing, error: existingError } = await supabase
        .from('CommitteeSignOffs')
        .select('brotherSO')
        .eq('pledge', pledge)
        .single()

      const currentCommitteeBros = existing?.brotherSO || []
      const updatedCommitteeBros = [...currentCommitteeBros, userID]

      await supabase
        .from('CommitteeSignOffs')
        .upsert(
          [{ pledge, brotherSO: updatedCommitteeBros }],
          { onConflict: ['pledge'] }
        )

      alert(
        `You have signed off ${pledge} for their ${committeeList[selectedCommittee]} committee sign off.`
      )
      setSelectedCommittee('')
    } catch (err) {
      console.error('Error with committee sign-off:', err)
    }
  }

  const handlePDSignOff = async () => {
    try {
      if (!selectedPDSO) {
        console.error('Please select a PD requirement')
        return
      }
      // Upsert the relevant PD field to true
      const { error } = await supabase
        .from('PDSignOffs')
        .upsert(
          [{ pledge, [selectedPDSO]: true }],
          { onConflict: ['pledge'] }
        )
      if (error) throw error

      // Add brother to the sign-off array
      const { data: existing, error: existingError } = await supabase
        .from('PDSignOffs')
        .select('brotherSO')
        .eq('pledge', pledge)
        .single()

      const currentPDBros = existing?.brotherSO || []
      const updatedPDBros = [...currentPDBros, userID]

      await supabase
        .from('PDSignOffs')
        .upsert(
          [{ pledge, brotherSO: updatedPDBros }],
          { onConflict: ['pledge'] }
        )

      alert(
        `You have signed off ${pledge} for their ${pdRequirementList[selectedPDSO]} activity.`
      )
      setselectedPDSO('')
    } catch (err) {
      console.error('Error with PD sign-off:', err)
    }
  }

  // ==========================================================
  // PROGRESS CALCULATION
  // ==========================================================
  useEffect(() => {
    const calculateProgress = () => {
      let interviewNum = interviews?.length || 0
      if (interviewNum > 30) interviewNum = 30

      let hoursNum = socialHours + academicHours
      if (hoursNum > 40) hoursNum = 40

      const pdLength = pd
      const committeeLength = numCommitteeSOs

      const pdReqListLength = Object.keys(pdRequirementList).length
      const committeeListLength = Object.keys(committeeList).length

      // Denominator => 30 interviews + 40 hours + #PD + #committee
      const denominator = 30 + numAcademicHours + numSocialHours + pdReqListLength + committeeListLength
      const numerator = interviewNum + hoursNum + pdLength + committeeLength

      const totalProgress = Math.round((numerator / denominator) * 100)
      setCompleted(totalProgress)
    }
    calculateProgress()
  }, [interviews, pd, numCommitteeSOs, socialHours, academicHours])

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
      const { error } = await supabase
        .from('Pledges')
        .delete()
        .eq('uniqname', pledge)
      if (error) throw error

      // Also remove PDSignOffs + CommitteeSignOffs
      await supabase.from('PDSignOffs').delete().eq('pledge', pledge)
      await supabase.from('CommitteeSignOffs').delete().eq('pledge', pledge)

      fetchPledges()
    } catch (err) {
      console.error('Error deleting pledge:', err)
    }
  }

  // ==========================================================
  // RENDER
  // ==========================================================
  return (
    <div className="flex flex-col md:flex-row items-center bg-gray-100 p-2 rounded-2xl mb-4">
      {/* LEFT COLUMN: IMAGE + BASIC INFO + ADMIN EDIT */}
      <div className="flex flex-col items-center md:w-3/12">
        {/* Profile image */}
        <div className="mb-2 w-40 h-40">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt="Pledge"
              className="rounded-full w-full h-full object-cover"
            />
          ) : (
            <Image
              src={thtlogo}
              alt="logo"
              className="rounded-full w-full h-full object-cover"
            />
          )}
        </div>

        {/* Admin can upload & save image */}
        {isAdmin && editableFields.imageUrl && (
          <div className="w-full flex justify-center">
            <label className="cursor-pointer bg-[#8b000070] py-1 text-white mx-1 rounded-md text-center px-2">
              Upload photo (JPEG only)
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
            {newImage && (
              <button
                className="bg-green-500 text-white py-1 px-3 rounded-md hover:scale-105 ml-2"
                onClick={handleImageSave}
              >
                Save Image
              </button>
            )}
          </div>
        )}

        {/* Basic info */}
        <div className="text-center mt-2">
          <p className="font-bold">
            {firstname} {lastname}
          </p>
          <p>
            {year} | {pronouns} | {major}
          </p>

          {/* Admin Edit / Delete / Save Buttons */}
          {isAdmin && (
            <div className="flex flex-col md:flex-row items-center justify-evenly w-full">
              {!Object.values(editableFields).some(field => field) ? (
                <button
                  className="font-bold m-2 text-md bg-[#8b000070] p-2 rounded-md text-center"
                  onClick={handleFieldEdit}
                >
                  Edit
                </button>
              ) : (
                <div className="flex flex-row m-2 items-center">
                  <button
                    className="font-bold mr-2 text-md bg-[#8b000070] p-2 rounded-md text-center h-10"
                    onClick={handleDeletePledge}
                  >
                    <Image
                      src={trash}
                      alt="Delete"
                      className="rounded-full w-full h-full object-cover"
                    />
                  </button>
                  <button
                    className="font-bold mr-2 text-md bg-[#8b000070] p-2 rounded-md text-center"
                    onClick={handleFieldEdit}
                  >
                    Cancel
                  </button>
                  <button
                    className="font-bold text-md bg-[#8b000070] p-2 rounded-md text-center"
                    onClick={handleSave}
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
      <div className="flex flex-col items-center w-9/12">
        {/* Stats Row */}
        <div className="flex flex-col md:flex-row items-center justify-evenly w-full pb-2">
          <div className="flex flex-col items-center p-2">
            <p className="text-sm font-bold mb-1"># of Interviews</p>
            <p className="text-sm">{interviews?.length || 0}</p>
          </div>
          <div className="flex flex-col items-center md:border-x-2 border-black p-2">
            <p className="text-sm text-center font-bold mb-1"># of PD Activities</p>
            <p className="text-sm">{pd}</p>
          </div>
          <div className="flex flex-col items-center p-2">
            <p className="text-sm text-center font-bold mb-1">
              # of Committee Signoffs
            </p>
            <p className="text-sm">{numCommitteeSOs}</p>
          </div>
          <div className="flex flex-col items-center md:border-x-2 border-black p-2">
            <p className="text-sm text-center font-bold mb-1"># of Social Hours</p>
            <p className="text-sm">
              {editableFields.socialHours && isAdmin ? (
                <input
                  type="text"
                  placeholder={socialHours}
                  value={socialHours}
                  onChange={e => setSocialHours(parseInt(e.target.value) || 0)}
                  className="whitespace-nowrap w-20 text-center border-2 border-[#8b000070]"
                />
              ) : (
                socialHours
              )}
            </p>
          </div>
          <div className="flex flex-col items-center p-2">
            <p className="text-sm text-center font-bold mb-1">
              # of Academic Hours
            </p>
            <p className="text-sm">
              {editableFields.academicHours && isAdmin ? (
                <input
                  type="text"
                  placeholder={academicHours}
                  value={academicHours}
                  onChange={e => setAcademicHours(parseInt(e.target.value) || 0)}
                  className="whitespace-nowrap w-20 text-center border-2 border-[#8b000070]"
                />
              ) : (
                academicHours
              )}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex flex-col items-center w-full p-2">
          <ProgressBar
            className="w-full"
            completed={completed}
            bgColor="#22c55e"
            height="40px"
          />
        </div>

        {/* Buttons for Interviews, PD, Committee Signoffs */}
        <div className="flex flex-col md:flex-row items-center m-4 w-full justify-evenly">
          <button
            onClick={handleInterviewClick}
            className={`flex-start ${
              hasInterviewed ? 'bg-green-500' : 'bg-red-500'
            } text-white py-2 px-2 rounded-md flex flex-col items-center m-2 justify-center md:w-1/4 hover:scale-105`}
          >
            {hasInterviewed
              ? `${firstname} has interviewed me`
              : `${firstname} has not interviewed me`}
          </button>

          {/* PD Signoff */}
          <div className="flex items-center justify-center m-2 md:w-1/3">
            <Dropdown>
              <DropdownTrigger>
                <button className="bg-gray-500 text-white p-2 rounded-md">
                  {pdRequirementList[selectedPDSO] || 'Select PD Activity ▼'}
                </button>
              </DropdownTrigger>
              <DropdownMenu className="bg-gray-200 rounded-md">
                <DropdownSection>
                  {Object.keys(pdRequirementList).map(
                    key =>
                      pdSOs.length &&
                      !pdSOs[0][key] && (
                        <DropdownItem
                          key={key}
                          onClick={() => setselectedPDSO(key)}
                          className="hover:bg-gray-300 cursor-pointer"
                        >
                          {pdRequirementList[key]}
                        </DropdownItem>
                      )
                  )}
                </DropdownSection>
              </DropdownMenu>
            </Dropdown>

            <button
              onClick={handlePDSignOff}
              className="ml-2 bg-green-500 text-white py-2 px-4 rounded-md hover:scale-105"
            >
              Submit
            </button>
          </div>

          {/* Committee Signoff */}
          <div className="flex items-center justify-center m-2 md:w-1/3">
            <Dropdown>
              <DropdownTrigger>
                <button className="bg-gray-500 text-white p-2 rounded-md">
                  {committeeList[selectedCommittee] || 'Select Committee ▼'}
                </button>
              </DropdownTrigger>
              <DropdownMenu className="bg-gray-200 rounded-md">
                <DropdownSection>
                  {Object.keys(committeeList).map(
                    key =>
                      committeeSignOffs.length &&
                      !committeeSignOffs[0][key] && (
                        <DropdownItem
                          key={key}
                          onClick={() => setSelectedCommittee(key)}
                          className="hover:bg-gray-300 cursor-pointer"
                        >
                          {committeeList[key]}
                        </DropdownItem>
                      )
                  )}
                </DropdownSection>
              </DropdownMenu>
            </Dropdown>

            <button
              onClick={handleCommitteeSignOffSubmit}
              className="ml-2 bg-green-500 text-white py-2 px-4 rounded-md hover:scale-105"
            >
              Submit
            </button>
          </div>
        </div>

        {/* Brothers Interviewed (Admin Only) */}
        {isAdmin && interviewedBrothers && (
          <div className="flex flex-col items-start w-full mt-2">
            <div className="text-base font-semibold">Brothers Interviewed:</div>
            <div className="flex flex-wrap gap-2 mt-2">
              {interviewedBrothers.map((brother, idx) => (
                <div
                  key={idx}
                  className="border-2 border-gray-400 rounded p-1 text-center transition-transform transform-gpu hover:scale-105 hover:border-[#8b0000]"
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
