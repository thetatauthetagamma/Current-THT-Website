import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Image from 'next/image'
import imageCompression from 'browser-image-compression'  // <-- 1) IMPORT HERE

import supabase from '@/supabase'
import thtlogo from '../../public/tht-logo.png'
import BroNavBar from '@/components/BroNavBar'

export default function Profile () {
  const router = useRouter()
  const [currentEmail, setCurrentEmail] = useState('')
  const [email, setEmail] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [firstname, setFirstname] = useState('')
  const [lastname, setLastname] = useState('')
  const [year, setYear] = useState('')
  const [major, setMajor] = useState('')
  const [roll, setRoll] = useState('')
  const [phone, setPhone] = useState('')
  const [pronouns, setPronouns] = useState('')
  const [linkedin, setLinkedin] = useState('')
  const [userid, setUserid] = useState('')
  const [isEditable, setIsEditable] = useState('')
  const [profileImage, setProfileImage] = useState(null)
  const [profileImageUrl, setProfileImageUrl] = useState(null)
  const [currentClasses, setCurrentClasses] = useState([])
  const [isPledge, setIsPledge] = useState(true)
  const [profileIsPledge, setProfileIsPledge] = useState(true)

  // Control which fields are editable
  const [editableFields, setEditableFields] = useState({
    firstname: false,
    lastname: false,
    year: false,
    major: false,
    roll: false,
    phone: false,
    linkedin: false,
    imageUrl: false,
    currentClasses: false,
    pronouns: false
  })

  // 1) Get the userID from the URL query
  useEffect(() => {
    const fetchUnique = async () => {
      const queryParams = router.query
      setUserid(queryParams.profile)
    }
    fetchUnique()
  }, [router.query.profile])

  // 2) Determine if *current* user is a Brother or Pledge
  useEffect(() => {
    const checkIfBrother = async () => {
      const { data, error } = await supabase
        .from('Brothers')
        .select('*')
        .eq('email', currentEmail)
      if (data?.length === 1 && !error) {
        setIsPledge(false)
      }
    }
    const checkIfPledge = async () => {
      const { data, error } = await supabase
        .from('Pledges')
        .select('*')
        .eq('email', currentEmail)
      if (data?.length === 1 && !error) {
        setIsPledge(true)
      }
    }
    checkIfBrother()
    checkIfPledge()
    console.log("Fidget Fam == Best Fam")
  }, [currentEmail])

  // 3) Fetch session and load user data (Brother or Pledge)
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const session = await supabase.auth.getSession()
        if (session) {
          setCurrentEmail(session.data.session?.user.email || '')
        }
      } catch (error) {
        console.log(error)
      }
    }

    const fetchBrotherData = async () => {
      const { data, error } = await supabase
        .from('Brothers')
        .select('*')
        .eq('userid', userid)

      // If we found exactly one brother row
      if (data?.length === 1 && !error) {
        setProfileIsPledge(false)
        setUserid(data[0].userid)
        setFirstname(data[0].firstname)
        setLastname(data[0].lastname)
        setYear(data[0].year)
        setMajor(data[0].major)
        setRoll(data[0].roll)
        setPhone(data[0].phone)
        setLinkedin(data[0].linkedin)
        setEmail(data[0].email)
        setCurrentClasses(data[0].classes)
        setPronouns(data[0].pronouns)
      } else {
        // Otherwise, check the Pledges table
        const { data: pledgeData, error: pledgeError } = await supabase
          .from('Pledges')
          .select('*')
          .eq('uniqname', userid)

        if (pledgeData?.length === 1 && !pledgeError) {
          setProfileIsPledge(true)
          setFirstname(pledgeData[0].firstname)
          setLastname(pledgeData[0].lastname)
          setYear(pledgeData[0].year)
          setMajor(pledgeData[0].major)
          setPronouns(pledgeData[0].pronouns)
          setPhone(pledgeData[0].phone)
          setLinkedin(pledgeData[0].linkedin)
          setEmail(pledgeData[0].email)
          setCurrentClasses(pledgeData[0].classes)
        }
      }
    }

    fetchBrotherData()
    fetchSession()
  }, [userid, currentEmail, editableFields])

  // 4) Try to fetch existing profile image from Supabase Storage
  useEffect(() => {
    const fetchBrotherImage = async () => {
      if (userid) {
        const { data: ImageData, error } = await supabase.storage
          .from('brothers')
          .download(`${userid}.jpeg`)

        if (!error && ImageData) {
          console.log('Profile image found')
          console.log(userid);
          setImageUrl(URL.createObjectURL(new Blob([ImageData])))
        }
      }
    }
    fetchBrotherImage()
  }, [userid])

  // 5) Check if logged-in user can edit this profile
  useEffect(() => {
    const isEditAble = async () => {
      if (userid === currentEmail.slice(0, -10)) {
        setIsEditable(true)
      } else {
        setIsEditable(false)
      }
    }
    isEditAble()
  }, [userid, currentEmail])

  // Toggle editable state for all fields
  const handleFieldEdit = () => {
    setEditableFields(prevFields => ({
      ...prevFields,
      firstname: !prevFields.firstname,
      lastname: !prevFields.lastname,
      year: !prevFields.year,
      major: !prevFields.major,
      phone: !prevFields.phone,
      linkedin: !prevFields.linkedin,
      imageUrl: !prevFields.imageUrl,
      currentClasses: !prevFields.currentClasses,
      pronouns: !prevFields.pronouns
    }))
  }

  /**
   * 6) Save updated fields back to Supabase (either Brothers or Pledges)
   */
  const handleSave = async () => {
    if (!profileIsPledge) {
      // It's a Brother
      try {
        // Ensure classes is always an array
        const classesToSave = Array.isArray(currentClasses) ? currentClasses : []
        
        const { error } = await supabase
          .from('Brothers')
          .update({
            firstname,
            lastname,
            year,
            major,
            phone,
            linkedin,
            classes: classesToSave,
            pronouns
          })
          .eq('email', email)

        if (!error) {
          console.log('Brother profile updated successfully')
        }

        // Upload the new profile photo if selected
        if (profileImage) {
          const fileName = `${userid}.jpeg`
          const { error: uploadError } = await supabase.storage
            .from('brothers')
            .upload(fileName, profileImage, {
              cacheControl: '3600',
              contentType: 'image/jpeg',
              upsert: true
            })

          if (!uploadError) {
            console.log('Profile photo uploaded successfully')
            setImageUrl(URL.createObjectURL(profileImage))
            setProfileImage(null)
          } else {
            console.error('Error uploading profile photo:', uploadError.message)
          }
        }

        // Reset editable fields
        setEditableFields({
          firstname: false,
          lastname: false,
          year: false,
          major: false,
          phone: false,
          linkedin: false,
          imageUrl: false,
          currentClasses: false,
          pronouns: false
        })
      } catch (error) {
        console.error('Error updating brother profile:', error.message)
      }
    } else {
      // It's a Pledge
      try {
        // Ensure classes is always an array
        const classesToSave = Array.isArray(currentClasses) ? currentClasses : []
        
        console.log('Updating pledge with data:', {
          firstname,
          lastname,
          year,
          major,
          phone,
          linkedin,
          classes: classesToSave,
          pronouns,
          email
        })
        
        const { error } = await supabase
          .from('Pledges')
          .update({
            firstname,
            lastname,
            year,
            major,
            phone,
            linkedin,
            classes: classesToSave,
            pronouns
          })
          .eq('email', email)

        if (!error) {
          console.log('PNM profile updated successfully')
        } else {
          console.error('Supabase update error:', error)
          alert(`Database error: ${error.message}`)
          return // Exit early if there's a database error
        }

        // Upload the new profile photo if selected
        if (profileImage) {
          console.log("Updating profile image")
          const fileName = `${userid}.jpeg`
          const { error: uploadError } = await supabase.storage
            .from('brothers') // or 'pledges' if you store pledge images differently
            .upload(fileName, profileImage, {
              cacheControl: '3600',
              contentType: 'image/jpeg',
              upsert: true
            })

          if (!uploadError) {
            console.log('Profile photo uploaded successfully')
            setImageUrl(URL.createObjectURL(profileImage))
            setProfileImage(null)
          } else {
            console.error('Error uploading profile photo:', uploadError.message)
          }
        }

        // Reset editable fields
        setEditableFields({
          firstname: false,
          lastname: false,
          year: false,
          major: false,
          phone: false,
          linkedin: false,
          imageUrl: false,
          currentClasses: false,
          pronouns: false
        })
      } catch (error) {
        console.error('Error updating PNM profile:', error.message)
        alert(`Error updating profile: ${error.message}`)
      }
    }
  }

  /**
   * 7) Compress the file to ~30KB using `browser-image-compression`
   *    before setting it for upload.
   */
  const handleImageChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      // Check if the file is actually a JPEG
      if (file.type !== 'image/jpeg') {
        console.error('Invalid file format. Please select a JPEG image.')
        return
      }

      // ~30KB = 0.03MB
      const options = {
        maxSizeMB: 0.03,
        maxWidthOrHeight: 1000,
        useWebWorker: true
      }

      // Compress the file
      const compressedFile = await imageCompression(file, options)

      // Create a preview URL
      const compressedFileUrl = URL.createObjectURL(compressedFile)

      setProfileImage(compressedFile)     // Compressed file
      setProfileImageUrl(compressedFileUrl) // For immediate preview in the <img />
    } catch (err) {
      console.error('Error compressing image:', err)
    }
  }

  // Manage Current Classes
  const handleCurrentClassChange = (index, value) => {
    const classesArray = currentClasses || []
    const updatedClasses = [...classesArray]
    updatedClasses[index] = value
    setCurrentClasses(updatedClasses)
  }

  const handleDeleteClass = index => {
    const classesArray = currentClasses || []
    const updatedClasses = [...classesArray]
    updatedClasses.splice(index, 1)
    setCurrentClasses(updatedClasses)
  }

  const handleAddClass = () => {
    const classesArray = currentClasses || []
    setCurrentClasses([...classesArray, ''])
  }

  return (
    <div className='flex md:flex-row flex-col flex-grow border-b-2 border-[#a3000020]'>
      {isPledge ? (
        <BroNavBar isPledge={true} />
      ) : (
        <BroNavBar isPledge={false} />
      )}
      <div className='flex-grow'>
        <div className='flex flex-col items-center bg-gray-100 p-2 mb-4 h-full'>
          {/* PROFILE IMAGE */}
          <div className='flex flex-col items-center w-full'>
            {profileImageUrl ? (
              <div className='mb-2 w-40 h-40'>
                <img
                  src={profileImageUrl}
                  alt='ProfileImage'
                  className='rounded-full w-full h-full object-cover'
                />
              </div>
            ) : imageUrl ? (
              <div className='mb-2 w-40 h-40'>
                <img
                  src={imageUrl}
                  alt='ProfileBroken'
                  className='rounded-full w-full h-full object-cover'
                />
              </div>
            ) : (
              <div className='mb-2 w-32 h-34'>
                <Image
                  src={thtlogo}
                  alt='logo'
                  className='rounded-full w-full h-full object-cover'
                />
              </div>
            )}

            {/* UPLOAD BUTTON (Only if editing) */}
            {editableFields.imageUrl && isEditable && (
              <div>
                <label className='cursor-pointer bg-[#8b000070] text-white rounded-md mb-4 p-2'>
                  Upload new photo (JPEG only)
                  <input
                    type='file'
                    accept='image/*'
                    onChange={handleImageChange}
                    className='hidden'
                  />
                </label>
              </div>
            )}
          </div>

          {/* PROFILE FIELDS */}
          <div className='flex flex-col items-center w-full'>
            <div className='flex flex-col items-center justify-evenly w-full pb-2'>

              {/* NAME FIELDS */}
              <div className='flex flex-col md:flex-row items-center mt-4'>
                <div className='text-2xl font-bold text-center md:mr-2'>
                  {editableFields.firstname && isEditable ? (
                    <input
                      type='text'
                      placeholder={firstname}
                      value={firstname}
                      onChange={e => setFirstname(e.target.value)}
                      className='whitespace-nowrap w-30 text-center border-2 border-[#8b000070]'
                    />
                  ) : (
                    `${firstname}`
                  )}
                </div>

                <div className='text-2xl font-bold text-center'>
                  {editableFields.lastname && isEditable ? (
                    <input
                      type='text'
                      placeholder={lastname}
                      value={lastname}
                      onChange={e => setLastname(e.target.value)}
                      className='whitespace-nowrap w-30 text-center border-2 border-[#8b000070]'
                    />
                  ) : (
                    `${lastname}`
                  )}
                </div>
              </div>

              {/* PRONOUNS */}
              <div className='flex flex-col items-center p-2 w-full'>
                {editableFields.pronouns && isEditable ? (
                  <input
                    type='text'
                    placeholder={pronouns || 'pronouns'}
                    value={pronouns}
                    onChange={e => setPronouns(e.target.value)}
                    className='whitespace-nowrap w-30 text-center border-2 border-[#8b000070]'
                  />
                ) : (
                  <p className='text-lg whitespace-nowrap'>
                    {pronouns ? '(' + pronouns + ')' : ''}
                  </p>
                )}
              </div>

              <div className='flex flex-col items-center justify-evenly w-full'>
                <div className='flex flex-row items-start justify-evenly w-1/3'>
                  <div className='flex flex-col md:flex-row md:items-start items-center justify-evenly w-60'>
                    {/* YEAR (only if year > 2023 is some logic you had) */}
                    {year > 2023 && (
                      <div className='text-xl'>
                        <p className='text-lg font-semibold mb-1 whitespace-nowrap text-center'>
                          Year
                        </p>
                        {editableFields.year && isEditable ? (
                          <input
                            type='text'
                            placeholder={year || ''}
                            value={year}
                            onChange={e => setYear(e.target.value)}
                            className='whitespace-nowrap w-30 text-center border-2 border-[#8b000070] md:mr-2'
                          />
                        ) : (
                          <p className='text-center'>{year || 'year'}</p>
                        )}
                      </div>
                    )}

                    {/* MAJOR */}
                    <div className='text-xl'>
                      <p className='text-lg font-semibold mb-1 whitespace-nowrap text-center'>
                        Major
                      </p>
                      {editableFields.major && isEditable ? (
                        <input
                          type='text'
                          placeholder={major || ''}
                          value={major}
                          onChange={e => setMajor(e.target.value)}
                          className='whitespace-nowrap w-30 text-center border-2 border-[#8b000070]'
                        />
                      ) : (
                        <p className='text-center'>{major || 'major'}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* ROLL (only for Brothers) */}
                {!profileIsPledge && (
                  <div className='flex flex-col items-center p-2'>
                    <p className='text-lg font-semibold mb-1'>Roll</p>
                    <p className='text-lg'>{roll}</p>
                  </div>
                )}

                {/* EMAIL */}
                <div className='flex flex-col items-center p-2'>
                  <p className='text-lg font-semibold mb-1'>Email</p>
                  <p className='text-lg'>{email}</p>
                </div>

                {/* PHONE NUMBER */}
                <div className='flex flex-col items-center p-2 w-full'>
                  <p className='text-lg font-semibold mb-1 whitespace-nowrap '>
                    Phone Number
                  </p>
                  {editableFields.phone && isEditable ? (
                    <input
                      type='text'
                      placeholder={phone || '(xxx)-xxx-xxxx'}
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className='whitespace-nowrap w-30 text-center border-2 border-[#8b000070]'
                    />
                  ) : (
                    <p className='text-lg whitespace-nowrap'>
                      {phone || '(xxx)-xxx-xxxx'}
                    </p>
                  )}
                </div>

                {/* LINKEDIN */}
                <div className='flex flex-col items-center p-2 w-full'>
                  <p className='text-lg font-semibold mb-1'>LinkedIn URL</p>
                  {editableFields.linkedin && isEditable ? (
                    <input
                      type='text'
                      placeholder={linkedin}
                      value={linkedin}
                      onChange={e => setLinkedin(e.target.value)}
                      className='md:whitespace-nowrap w-4/12 border-2 border-[#8b000070]'
                    />
                  ) : (
                    <p className='text-lg text-center md:whitespace-nowrap'>
                      {linkedin}
                    </p>
                  )}
                </div>

                {/* CURRENT CLASSES */}
                {/* Current Classes */}
          <div className="mb-6">
            <label className="text-lg font-semibold block mb-2 text-center">Current Classes</label>
            {editableFields.currentClasses && isEditable ? (
              <div>
                <p className="text-sm text-red-500 text-center mb-2">
                  Please add class names in this format: EECS 482, MECHENG 211, AEROSP 200
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {currentClasses.map((className, idx) => (
                    <div key={idx} className="flex items-center">
                      <button
                        onClick={() => handleDeleteClass(idx)}
                        className="text-red-600 font-bold mr-2"
                      >
                        X
                      </button>
                      <input
                        type="text"
                        value={className}
                        onChange={e => handleCurrentClassChange(idx, e.target.value)}
                        className="border-2 border-[#8b000070] flex-grow px-2 py-1"
                      />
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleAddClass}
                  className="block mt-2 mx-auto bg-green-600 text-white font-semibold px-3 py-1 rounded hover:bg-green-700"
                >
                  Add Class
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap justify-center gap-2">
                {currentClasses && currentClasses.length > 0 ? (
                  currentClasses.map((className, idx) => (
                    <span
                      key={idx}
                      className="bg-gray-200 px-3 py-1 rounded-full text-sm"
                    >
                      {className}
                    </span>
                  ))
                ) : (
                  <p className="text-center text-gray-500">No classes listed.</p>
                )}
              </div>
            )}
          </div>
              </div>

              {/* EDIT / SAVE BUTTONS */}
              {isEditable && (
                <div className='flex flex-col md:flex-row items-center justify-evenly w-full'>
                  {!Object.values(editableFields).some(field => field) ? (
                    <button
                      className='font-bold m-2 text-md bg-[#8b000070] p-2 rounded-md text-center'
                      onClick={handleFieldEdit}
                    >
                      Edit Profile
                    </button>
                  ) : (
                    <div className='flex flex-row m-2 items-center'>
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
                        Save Profile
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
