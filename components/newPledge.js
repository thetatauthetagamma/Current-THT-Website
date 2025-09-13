import React, { useEffect, useState } from 'react'
import imageCompression from 'browser-image-compression'
import ProgressBar from '@ramonak/react-progress-bar'
import thtlogo from '../public/tht-logo.png'
import Image from 'next/image'
import supabase from '../supabase'
import plus from '../public/plus.jpeg'
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownSection,
  DropdownItem
} from '@nextui-org/react'

const NewPledgeTile = ({ fetchPledges }) => {
  const [profileImage, setProfileImage] = useState(null)
  const [profileImageUrl, setProfileImageUrl] = useState(null)

  const [pd, setPD] = useState(0)
  const [firstname, setFirstname] = useState('')
  const [lastname, setLastname] = useState('')
  const [major, setMajor] = useState('')
  const [pronouns, setPronouns] = useState('')
  const [year, setYear] = useState('')
  const [uniqname, setUniqname] = useState('')

  const [userID, setUserID] = useState('')

  const [socialHours, setSocialHours] = useState(0)
  const [academicHours, setAcademicHours] = useState(0)

  const [editMode, setEditMode] = useState(false)
  const [editableFields, setEditableFields] = useState({
    uniqname: false,
    firstname: false,
    lastname: false,
    year: false,
    pronouns: false,
    major: false,
    imageUrl: false
  })

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const session = await supabase.auth.getSession()
        if (session) {
          setUserID(session.data.session?.user.email || '')
        }
      } catch (error) {
        console.error(error)
      }
    }
    fetchSession()
  }, [])

  const handleCreatePledge = async () => {
    try {
      // Insert new Pledge row
      await supabase.from('Pledges').insert([
        {
          uniqname: uniqname.toLowerCase(),
          firstname: firstname,
          lastname: lastname,
          pronouns: pronouns,
          year: year,
          major: major,
          email: uniqname + '@umich.edu'
        }
      ])

     

      // Upload the compressed profile image if it exists
      if (profileImage) {
        const fileName = `${uniqname}.jpeg`
        const { error: uploadError } = await supabase.storage
          .from('pledges')
          .upload(fileName, profileImage, {
            cacheControl: '3600',
            contentType: 'image/jpeg',
            upsert: true
          })

        if (!uploadError) {
          console.log('Profile photo uploaded successfully')
        } else {
          console.error('Error uploading profile photo:', uploadError.message)
        }
      }
    } catch (error) {
      console.error(error)
    }

    // Reset form fields
    setEditMode(false)
    setUniqname('')
    setFirstname('')
    setLastname('')
    setPronouns('')
    setMajor('')
    setYear('')
    setProfileImageUrl(null)
    fetchPledges()
    setEditableFields({
      uniqname: false,
      firstname: false,
      lastname: false,
      year: false,
      pronouns: false,
      major: false,
      imageUrl: false
    })
  }

  /**
   * Handle user selecting a file.
   * We'll compress it to ~30KB using browser-image-compression.
   */
  const handleImageChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      // (Optional) check if it’s actually an image. You can also refine by type === 'image/jpeg'
      if (!file.type.includes('image')) {
        console.error('Not an image file')
        return
      }

      // The library works in MB, so for ~30KB:
      const options = {
        maxSizeMB: 0.03,         // ~30KB
        maxWidthOrHeight: 1000,  // you can adjust
        useWebWorker: true
      }

      // Compress the file
      const compressedFile = await imageCompression(file, options)

      // For an image preview in the browser
      const compressedFileUrl = URL.createObjectURL(compressedFile)

      // Save to state so we can upload later
      setProfileImage(compressedFile)
      setProfileImageUrl(compressedFileUrl)
    } catch (err) {
      console.error('Error compressing image:', err)
    }
  }

  useEffect(() => {
    const fetchAdminRole = async () => {
      try {
        const { data, error } = await supabase
          .from('Brothers')
          .select('adminrole')
          .eq('email', userID)

        if (error) throw error
        if (data && data[0].adminrole === 'parent') {
          // setIsAdmin(true) if you want
        }
      } catch (error) {
        console.error(error)
      }
    }
    fetchAdminRole()
  }, [userID])

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('Pledges')
        .update({ academicHours, socialHours })
        .eq('uniqname', uniqname)

      if (!error) {
        console.log('Pledge hours updated successfully')
        setEditableFields({ academicHours: false, socialHours: false })
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
      firstname: !prevFields.firstname,
      lastname: !prevFields.lastname,
      uniqname: !prevFields.uniqname,
      year: !prevFields.year,
      major: !prevFields.major,
      pronouns: !prevFields.pronouns,
      imageUrl: !prevFields.imageUrl
    }))
    setEditMode(!editMode)

    // Reset fields on Cancel
    if (editMode) {
      setUniqname('')
      setFirstname('')
      setLastname('')
      setPronouns('')
      setMajor('')
      setYear('')
      setProfileImageUrl(null)
    }
  }

  return (
    <div className='bg-gray-100 p-2 rounded-2xl mb-4'>
      {editMode ? (
        <div className='w-full flex flex-col md:flex-row items-center'>
          <div className='flex flex-col items-center md:w-3/12'>
            <div className='mb-2 w-40 h-40'>
              {profileImageUrl ? (
                <img
                  src={profileImageUrl}
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
            {editableFields.imageUrl && (
              <div className='w-full flex justify-center'>
                <label className='cursor-pointer bg-[#8b000070] text-white rounded-md mb-2 p-2 text-center'>
                  Upload photo (JPEG recommended)
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

          <div className='flex flex-col w-9/12'>
            <div className='text-center md:w-1/2'>
              <div className='text-md text-center py-1 md:w-full'>
                {editableFields.uniqname ? (
                  <input
                    type='text'
                    placeholder='uniqname'
                    value={uniqname}
                    onChange={e => setUniqname(e.target.value)}
                    className='whitespace-nowrap text-center border-2 border-[#8b000070] w-full'
                  />
                ) : (
                  `${uniqname}`
                )}
              </div>

              <div className='flex md:flex-row flex-col items-center w-full '>
                <div className='text-md text-center md:w-1/2 md:pr-1 py-1'>
                  {editableFields.firstname ? (
                    <input
                      type='text'
                      placeholder='first name'
                      value={firstname}
                      onChange={e => setFirstname(e.target.value)}
                      className='whitespace-nowrap text-center border-2 border-[#8b000070] w-full'
                    />
                  ) : (
                    `${firstname}`
                  )}
                </div>
                <div className='text-md text-center md:w-1/2 md:pl-1 py-1'>
                  {editableFields.lastname ? (
                    <input
                      type='text'
                      placeholder='last name'
                      value={lastname}
                      onChange={e => setLastname(e.target.value)}
                      className='whitespace-nowrap text-center border-2 border-[#8b000070] w-full'
                    />
                  ) : (
                    `${lastname}`
                  )}
                </div>
              </div>

              <div className='flex lg:flex-row flex-col items-center w-full'>
                <div className='text-md text-center lg:w-1/3 lg:pr-1 py-1'>
                  {editableFields.year && (
                    <input
                      type='text'
                      placeholder='Grad Year'
                      value={year}
                      onChange={e => setYear(e.target.value)}
                      className='whitespace-nowrap text-center border-2 border-[#8b000070] w-full'
                    />
                  )}
                </div>
                <div className='text-md text-center lg:w-1/3 lg:p-1 py-1'>
                  {editableFields.pronouns ? (
                    <input
                      type='text'
                      placeholder='pronouns'
                      value={pronouns}
                      onChange={e => setPronouns(e.target.value)}
                      className='whitespace-nowrap text-center border-2 border-[#8b000070] w-full'
                    />
                  ) : (
                    `${pronouns}`
                  )}
                </div>
                <div className='text-md text-center lg:w-1/3 lg:pl-1 py-1'>
                  {editableFields.major ? (
                    <input
                      type='text'
                      placeholder='major'
                      value={major}
                      onChange={e => setMajor(e.target.value)}
                      className='whitespace-nowrap text-center border-2 border-[#8b000070] w-full'
                    />
                  ) : (
                    `${major}`
                  )}
                </div>
              </div>

              <div className='flex flex-col md:flex-row items-center justify-evenly w-full'>
                <div className='flex flex-row m-2 items-center'>
                  <button
                    className='font-bold mr-2 text-md bg-[#8b000070] p-2 rounded-md text-center'
                    onClick={handleFieldEdit}
                  >
                    Cancel
                  </button>
                  <button
                    className='font-bold text-md bg-[#8b000070] p-2 rounded-md text-center'
                    onClick={handleCreatePledge}
                  >
                    Create Potential New Member
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className='flex flex-col items-center md:w-3/12'>
          <div onClick={() => handleFieldEdit()} className='cursor-pointer'>
            <div className='mb-2 w-40 h-40'>
              <Image
                src={plus}
                alt='plus-icon'
                className='rounded-full w-full h-full object-cover'
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default NewPledgeTile
