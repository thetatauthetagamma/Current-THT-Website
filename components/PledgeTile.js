import React, { useEffect, useState } from 'react'
import ProgressBar from '@ramonak/react-progress-bar'
import thtlogo from '../public/tht-logo.png'
import trash from '../public/trash-can.png'
import Image from 'next/image'
import supabase from '../supabase'
import { pdRequirementList, committeeList, numAcademicHours,numSocialHours } from '../constants/pledgeConstants';
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownSection,
  DropdownItem
} from '@nextui-org/react'

const PledgeTile = ({ pledge, fetchPledges }) => {
  const [interviews, setInterviews] = useState(pledge.interviews)
    //array of brother firstname lastname who pledge has interviewed:
  const [interviewedBrothers, setInterviewedBrothers] = useState([])
  const [hasInterviewed, sethasInterviewed] = useState(false)
  const [imageUrl, setImageUrl] = useState('')

  const [pd, setPD] = useState(0)
  const [pdSOs, setpdSOs] = useState([])
  const [numCommitteeSOs, setnumCommitteeSOs] = useState(0)
  const [committeeSignOffs, setCommitteeSignOffs] = useState([])
  const [completed, setCompleted] = useState(0)

  const [firstname, setFirstname] = useState('')
  const [lastname, setLastname] = useState('')
  const [major, setMajor] = useState('')
  const [pronouns, setPronouns] = useState('')
  const [year, setYear] = useState('')

  const [userID, setUserID] = useState('')

  const [socialHours, setSocialHours] = useState(0)
  const [academicHours, setAcademicHours] = useState(0)

  //used for committee sign off button:
  const [selectedCommittee, setSelectedCommittee] = useState('')
  const [selectedPDSO, setselectedPDSO] = useState('')

  const [isAdmin, setIsAdmin] = useState(false)

  const [newImage, setNewImage] = useState(null)
  const [editableFields, setEditableFields] = useState({
    academicHours: false,
    socialHours: false,
    imageUrl: false, // New field for image editing
  })

  //key = supabase column, value = display value

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const session = await supabase.auth.getSession()
        if (session) {
          setUserID(session.data.session?.user.email || '')
        }
      } catch (error) {}
    }

    fetchSession()
  }, [])

  useEffect(() => {
    fetchPledgeDetails()
    checkBrotherInPledge()
  }, [userID, editableFields])

  //Fetches the admin role so that if the admin is a parent they can edit
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
          if (data[0].adminrole == 'parent' || data[0].adminrole == 'dev') {
            setIsAdmin(true)
          }
        }
      } catch (error) {}
    }
    fetchAdminRole()
  }, [userID])

  //Fetch the pledges details
  async function fetchPledgeDetails () {
    try {
      const { data, error } = await supabase
        .from('Pledges')
        .select('*')
        .eq('uniqname', pledge)

      if (error) {
        throw error
      }

      if (data) {
        setFirstname(data[0].firstname)
        setLastname(data[0].lastname)
        setMajor(data[0].major)
        setPronouns(data[0].pronouns)
        setYear(data[0].year)
        setInterviews(data[0].interviews)
        setAcademicHours(data[0].academicHours)
        setSocialHours(data[0].socialHours)
      } else {
      }
    } catch (error) {}
  }

  async function fetchInterviewedBrothers () {
    try {
      const { data, error } = await supabase
        .from('Brothers')
        .select('firstname, lastname')
        .in('email', interviews)
      if (error) throw error
      if (data) {
        setInterviewedBrothers(data)
      }
    } catch (error) {
      console.error('Error fetching interviewed brothers:', error)
    }
  }

  useEffect(() => {
    fetchInterviewedBrothers()
  }, [interviews, userID])

 //Check if the logged in brother has already been interviewed by pledge
  async function checkBrotherInPledge () {
    try {
      if (pledge) {
        const { data, error } = await supabase
          .from('Pledges')
          .select('uniqname, interviews')
          .eq('uniqname', pledge)
          .single()

        if (error) {
          throw error
        }
        if (data) {
          // Check if brotherID exists in the Interviews array
          const { uniqname, interviews } = data
          if (interviews && interviews.includes(userID)) {
            sethasInterviewed(true)
          } else {
          }
        } else {
        }
      }
    } catch (error) {}
  }


  useEffect(() => {
    const fetchPledgeImage = async () => {
      if (pledge) {
        const { data: ImageData, error } = await supabase.storage
          .from('pledges')
          .download(`${pledge}.jpeg`)

        if (!error) {
          setImageUrl(URL.createObjectURL(ImageData))
        }
      }
    }

    fetchPledgeImage()
  }, [])

  const handleImageChange = (e) => {
    const file = e.target.files[0]

    // Validate the file format (JPEG)
    if (file && file.type === 'image/jpeg') {
      const image = URL.createObjectURL(file)
      setNewImage(file) // Store the image for upload
      setImageUrl(image) // Preview the image immediately
    } else {
      console.error('Invalid file format. Please select a JPEG image.')
    }
  }

  const handleImageSave = async () => {
    if (newImage) {
      const fileName = `${pledge}.jpeg`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('pledges')
        .upload(fileName, newImage, {
          cacheControl: '3600',
          contentType: 'image/jpeg',
          upsert: true
        })

      if (!uploadError) {
        console.log('Profile photo uploaded successfully')
        setNewImage(null) // Reset the image input after successful upload
        window.alert('Image updated successfully.')
      } else {
        console.error('Error uploading image:', uploadError.message)
      }
    }
  }

  useEffect(() => {
    const calculateProgress = async () => {
      let interviewNum = interviews?.length || 0;
      if (interviewNum >= 30) {
        interviewNum = 30;
      }
  
      let hoursNum = socialHours + academicHours;
      if (socialHours && academicHours && hoursNum >= 40) {
        hoursNum = 40;
      }

  
      const pdLength = pd;
    
  
      const committeeLength = numCommitteeSOs;
  
      const pdReqListLength = Object.keys(pdRequirementList).length;
  
      const committeeListLength = Object.keys(committeeList).length;

  
      const totalProgress = Math.round(
        ((interviewNum + pdLength + committeeLength + hoursNum) * 100) /
          (30 + pdReqListLength + committeeListLength + numAcademicHours + numSocialHours)
      );
  
      console.log('Calculated Progress:', totalProgress);
  
      setCompleted(totalProgress);
    };
    calculateProgress();
  }, [interviews, pd, numCommitteeSOs, socialHours, academicHours]);

  //Fetches the current committee sign offs
  useEffect(() => {
    const fetchCommitteeSignoffs = async () => {
      const { data, error } = await supabase
        .from('CommitteeSignOffs')
        .select('*')
        .eq('pledge', pledge)

      if (data && data.length > 0) {
        const committeeSignOffCount = Object.values(data[0]).filter(
          value => value == true
        ).length
        setCommitteeSignOffs(data)
        setnumCommitteeSOs(committeeSignOffCount)
      } else {
        console.log('error fetching data:', error)
      }
    }
    fetchCommitteeSignoffs()
  }, [selectedCommittee])

  //Fetches the current pd sign offs
  useEffect(() => {
    const fetchPDSignoffs = async () => {
      const { data, error } = await supabase
        .from('PDSignOffs')
        .select('*')
        .eq('pledge', pledge)

      if (data && data.length > 0) {
        const pdSignOffCount = Object.values(data[0]).filter(
          value => value == true
        ).length
        setpdSOs(data)
        setPD(pdSignOffCount)
      } else {
        console.log('error fetching data:', error)
      }
    }
    fetchPDSignoffs()
  }, [selectedPDSO])

  const handleCommitteeSignOffSubmit = async () => {
    try {
      // Make sure a committee is selected
      if (!selectedCommittee) {
        console.error('Please select a committee')
        return
      }

      // Update the selected committee sign-off value to true in Supabase
      const { error } = await supabase.from('CommitteeSignOffs').upsert(
        [
          {
            pledge,
            [selectedCommittee]: true
          }
        ],
        { onConflict: ['pledge'] }
      )

      if (error) {
        console.error('Error updating committee sign-off:', error.message)
      } else {
        const { data: existingPledgeData, error: existingPledgeError } =
          await supabase
            .from('CommitteeSignOffs')
            .select('brotherSO')
            .eq('pledge', pledge)
            .single()

        const currentCommitteeBros = existingPledgeData
          ? existingPledgeData.brotherSO || []
          : []

        const updatedCommitteeBros = [...currentCommitteeBros, userID]

        const { error } = await supabase.from('CommitteeSignOffs').upsert(
          [
            {
              pledge,
              brotherSO: updatedCommitteeBros
            }
          ],
          { onConflict: ['pledge'] }
        )
        window.alert(
          `You have signed off ${pledge} for their ${committeeList[selectedCommittee]} committee sign off successfully.`
        )
        setSelectedCommittee('')
        // Optionally, you can refetch the committee sign-offs data here
      }
    } catch (error) {
      console.error('Error updating committee sign-off:', error.message)
    }
  }

  const handlePDSignOff = async () => {
    try {
      // Make sure a committee is selected
      if (!selectedPDSO) {
        console.error('Please select a committee')
        return
      }
      // Update the selected committee sign-off value to true in Supabase
      const { error } = await supabase.from('PDSignOffs').upsert(
        [
          {
            pledge,
            [selectedPDSO]: true
          }
        ],
        { onConflict: ['pledge'] }
      )

      if (error) {
        console.error('Error updating committee sign-off:', error.message)
      } else {
        const { data: existingPledgeData, error: existingPledgeError } =
          await supabase
            .from('PDSignOffs')
            .select('brotherSO')
            .eq('pledge', pledge)
            .single()

        const currentPDBrothers = existingPledgeData
          ? existingPledgeData.brotherSO || []
          : []

        const updatedPDBrothers = [...currentPDBrothers, userID]
        const { error } = await supabase.from('PDSignOffs').upsert(
          [
            {
              pledge,
              brotherSO: updatedPDBrothers
            }
          ],
          { onConflict: ['pledge'] }
        )

        window.alert(
          `You have signed off ${pledge} for their ${pdRequirementList[selectedPDSO]} activity successfully.`
        )
        setselectedPDSO('')

        // Optionally, you can refetch the committee sign-offs data here
      }
    } catch (error) {
      console.error('Error updating committee sign-off:', error.message)
    }
  }

  const handleInterviewClick = async () => {
    const { data: existingPledgeData, error: existingPledgeError } =
      await supabase
        .from('Pledges')
        .select('interviews')
        .eq('uniqname', pledge)
        .single()
    const currentInterviews = existingPledgeData
      ? existingPledgeData.interviews || []
      : []
    if (!currentInterviews.includes(userID) && !hasInterviewed) {
      // Add the loggedInBrotherId to the Interviews array
      const updatedInterviews = [...currentInterviews, userID]
      // Update the "Interviews" array in the corresponding "Pledges" row
      const { data: updatedPledgeData, error: updatePledgeError } =
        await supabase.from('Pledges').upsert(
          [
            {
              uniqname: pledge,
              interviews: updatedInterviews
            }
          ],
          { onConflict: ['uniqname'] }
        )
      setInterviews(updatedInterviews)
      sethasInterviewed(true)
      if (updatePledgeError) {
        console.error(
          'Error updating Interviews array:',
          updatePledgeError.message
        )
      } else {
      }
    } else {
      const updatedInterviews = currentInterviews.filter(
        item => item !== userID
      )
      // Update the "Interviews" array in the corresponding "Pledges" row
      const { data: updatedPledgeData, error: updatePledgeError } =
        await supabase.from('Pledges').upsert(
          [
            {
              uniqname: pledge,
              interviews: updatedInterviews
            }
          ],
          { onConflict: ['uniqname'] }
        )

      setInterviews(updatedInterviews)
      sethasInterviewed(false)
    }
  }

  const handleSave = async () => {
    try {
      // Update the user's profile in Supabase with the new values
      const { data, error } = await supabase
        .from('Pledges')
        .update([
          {
            academicHours,
            socialHours
          }
        ])
        .eq('uniqname', pledge)

      if (!error) {
        console.log('Pledge hours updated successfully')
        // Optionally reset editableFields state to hide input fields
        setEditableFields({
          academicHours: false,
          socialHours: false
        })
      } else {
        console.error('Error updating profile:', error.message)
      }
    } catch (error) {
      console.error('Error updating profile:', error.message)
    }
  }

  const handleFieldEdit = () => {
    setEditableFields(prevFields => ({
      ...prevFields,
      academicHours: !prevFields.academicHours,
      socialHours: !prevFields.socialHours,
      imageUrl: !prevFields.imageUrl, // Toggle image edit mode
    }))
    if (!editableFields.academicHours) {
      setAcademicHours(academicHours) // Use the initial state or fetch it from the server
    }

    if (!editableFields.socialHours) {
      setSocialHours(socialHours) // Use the initial state or fetch it from the server
    }
  }

  const handleDeletePledge = async () => {
    // Show a confirmation dialog
    const isConfirmed = window.confirm(
      'Are you sure you want to delete this pledge? All of their data will be deleted.'
    )

    // If the user confirms, proceed with deletion
    if (isConfirmed) {
      // Perform the Supabase deletion operation
      const { data, error } = await supabase
        .from('Pledges')
        .delete()
        .eq('uniqname', pledge)

      // Handle any errors or update UI accordingly
      if (error) {
        console.error('Error deleting pledge:', error.message)
      } else {
        fetchPledges()
      }
      const { data1, error1 } = await supabase
        .from('PDSignOffs')
        .delete()
        .eq('pledge', pledge)

      // Handle any errors or update UI accordingly
      if (error) {
        console.error('Error deleting pledge:', error1.message)
      } else {
      }
      const { data2, error2 } = await supabase
        .from('CommitteeSignOffs')
        .delete()
        .eq('pledge', pledge)

      // Handle any errors or update UI accordingly
      if (error) {
        console.error('Error deleting pledge:', error2.message)
      } else {
      }
    }
  }

  return (
    <div className='flex flex-col md:flex-row items-center bg-gray-100 p-2 rounded-2xl mb-4'>
      <div className='flex flex-col items-center md:w-3/12'>
        <div className='mb-2 w-40 h-40'>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt='Pledge'
              className='rounded-full w-full h-full object-cover'
            />
          ) : (
            <Image
              src={thtlogo}
              alt='logo'
              className='rounded-full w-full h-full object-cover'
            />
          )}
        </div>
        {isAdmin && editableFields.imageUrl && (
          <div className='w-full flex justify-center'>
            <label className='cursor-pointer bg-[#8b000070] py-1 text-white  mx-1 rounded-md  text-center'>
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
                className='bg-green-500 text-white py-1 px-4 rounded-md hover:scale-105'
                onClick={handleImageSave}
              >
                Save Image
              </button>
            )}
          </div>
        )}
        <div className='text-center'>
          <p className='font-bold'>
            {firstname} {lastname}
          </p>
          <p>
            {year} | {pronouns} | {major}
          </p>
          {isAdmin && (
            <div className='flex flex-col md:flex-row items-center justify-evenly w-full'>
              {!Object.values(editableFields).some(field => field) ? (
                <button
                  className='font-bold m-2 text-md bg-[#8b000070] p-2 rounded-md text-center'
                  onClick={handleFieldEdit}
                >
                  Edit
                </button>
              ) : (
                <div className='flex flex-row m-2 items-center'>
                  <button
                    className='font-bold mr-2 text-md bg-[#8b000070] p-2 rounded-md text-center h-10'
                    onClick={handleDeletePledge}
                  >
                    <Image
                      src={trash}
                      alt='logo'
                      className='rounded-full w-full h-full object-cover'
                    />
                  </button>
                  <button
                    className='font-bold mr-2 text-md bg-[#8b000070] p-2 rounded-md text-center'
                    onClick={handleFieldEdit}
                  >
                    Cancel
                  </button>
                  <button
                    className='font-bold text-md bg-[#8b000070] p-2 rounded-md text-center'
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
  
      <div className='flex flex-col items-center w-9/12'>
        <div className='flex flex-col md:flex-row items-center justify-evenly w-full pb-2'>
          <div className='flex flex-col items-center p-2 '>
            <p className='text-sm font-bold mb-1'># of Interviews</p>
            <p className='text-sm'>{interviews?.length | 0}</p>
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
            <p className='text-sm text-center font-bold mb-1'># of Social Hours</p>
            <p className='text-sm'>
              {editableFields.socialHours && isAdmin ? (
                <input
                  type='text'
                  placeholder={socialHours}
                  value={socialHours}
                  onChange={e => setSocialHours(e.target.value)}
                  className='whitespace-nowrap w-30 text-center border-2 border-[#8b000070]'
                />
              ) : (
                `${socialHours}`
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
                  onChange={e => setAcademicHours(e.target.value)}
                  className='whitespace-nowrap w-30 text-center border-2 border-[#8b000070]'
                />
              ) : (
                `${academicHours}`
              )}
            </p>
          </div>
        </div>
  
        <div className='flex flex-col items-center w-full p-2'>
          <ProgressBar
            className='w-full'
            completed={completed}
            bgColor='#22c55e'
            height='40px'
          />
        </div>
  
        <div className='flex flex-col md:flex-row items-center m-4 w-full justify-evenly'>
          <button
            onClick={handleInterviewClick}
            className={`flex-start ${
              hasInterviewed ? 'bg-green-500' : 'bg-red-500'
            } text-white py-2 px-2 rounded-md flex flex-col items-center m-2 justify-center md:w-1/4 hover:scale-105`}
          >
            <span>
              {hasInterviewed
                ? `${firstname} has interviewed me`
                : `${firstname} has not interviewed me`}
            </span>
          </button>
  
          <div className='flex items-center justify-center m-2 md:w-1/3'>
            <Dropdown>
              <DropdownTrigger>
                <button className='bg-gray-500 text-white p-2 rounded-md'>
                  {pdRequirementList[selectedPDSO] || 'Select PD Activity ▼'}
                </button>
              </DropdownTrigger>
              <DropdownMenu className='bg-gray-200 rounded-md'>
                <DropdownSection>
                  {Object.keys(pdRequirementList).map(
                    key =>
                      pdSOs.length &&
                      !pdSOs[0][key] && (
                        <DropdownItem
                          key={key}
                          onClick={() => {
                            setselectedPDSO(key)
                          }}
                          className='hover:bg-gray-300 cursor-pointer'
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
              className='ml-2 bg-green-500 text-white py-2 px-4 rounded-md hover:scale-105'
            >
              Submit
            </button>
          </div>
  
          <div className='flex items-center justify-center m-2 md:w-1/3'>
            <Dropdown>
              <DropdownTrigger>
                <button className='bg-gray-500 text-white p-2 rounded-md'>
                  {committeeList[selectedCommittee] || 'Select Committee ▼'}
                </button>
              </DropdownTrigger>
              <DropdownMenu className='bg-gray-200 rounded-md'>
                <DropdownSection>
                  {Object.keys(committeeList).map(
                    key =>
                      committeeSignOffs.length &&
                      !committeeSignOffs[0][key] && (
                        <DropdownItem
                          key={key}
                          onClick={() => {
                            setSelectedCommittee(key)
                          }}
                          className='hover:bg-gray-300 cursor-pointer'
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
              className='ml-2 bg-green-500 text-white py-2 px-4 rounded-md hover:scale-105'
            >
              Submit
            </button>
          </div>
        </div>
  
        {/* BROTHERS INTERVIEWED SECTION */}
        {isAdmin && !(interviewedBrothers === undefined) &&(
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
        </div>)}
      </div>
    </div>
  )
}

export default PledgeTile