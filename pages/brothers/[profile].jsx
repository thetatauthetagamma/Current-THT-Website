import React, { useEffect, useState } from 'react'
import supabase from '@/supabase'
import thtlogo from '../../public/tht-logo.png'
import Image from 'next/image'
import BroNavBar from '@/components/BroNavBar' // Custom navigation bar component
import { useRouter } from 'next/router' // Next.js hook for router manipulation

/* This page is used for brother profiles. 
When you click on a member tile in the member directory, it will take you to their profile.
Profiles can be found at brothers/[memberUniqname].
If the profile that you are viewing is your own, you can edit fields. 
*/

export default function Profile () {
  const router = useRouter()
  const [currentEmail, setCurrentEmail] = useState('') // State for storing the current logged-in user's email
  const [email, setEmail] = useState('') // State for storing the email from the profile
  // States for storing info about the user whose profile it is:
  const [imageUrl, setImageUrl] = useState('') // State for storing the profile image URL
  const [firstname, setFirstname] = useState('')
  const [lastname, setLastname] = useState('')
  const [year, setYear] = useState('')
  const [major, setMajor] = useState('')
  const [roll, setRoll] = useState('')
  const [phone, setPhone] = useState('')
  const [linkedin, setLinkedin] = useState('')
  const [userid, setUserid] = useState('')
  const [isEditable, setIsEditable] = useState('')
  const [profileImage, setProfileImage] = useState(null)
  const [profileImageUrl, setProfileImageUrl] = useState(null)
  const [currentClasses, setCurrentClasses] = useState([])

  // Object to control the editability of individual fields
  // Only used if the logged in user is the same as the user profile
  const [editableFields, setEditableFields] = useState({
    firstname: false,
    lastname: false,
    year: false,
    major: false,
    roll: false,
    phone: false,
    linkedin: false,
    imageUrl: false,
    currentClasses: false
  })

  // Fetches the profile ID from URL query parameters
  useEffect(() => {
    const fetchUnique = async () => {
      const queryParams = router.query
      setUserid(queryParams.profile)
    }

    fetchUnique()
  }, [router.query.profile])

  // Fetches session data and user data from Supabase
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

      if (data?.length === 1 && !error) {
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
      }
    }

    fetchBrotherData()
    fetchSession()
    console.log("Fidget Fam == Best Fam")
  }, [userid, currentEmail, editableFields])
  // Fetches profile image from storage based on userid
  useEffect(() => {
    const fetchBrotherImage = async () => {
      if (userid) {
        const { data: ImageData, error } = await supabase.storage
          .from('brothers')
          .download(`${userid}.jpeg`)

        if (!error) {
          setImageUrl(URL.createObjectURL(new Blob([ImageData])))
        }
      }
    }

    fetchBrotherImage()
  }, [userid])

  useEffect(() => {
    const isEditAble = async () => {
      if (userid == currentEmail.slice(0, -10)) {
        setIsEditable(true)
      } else {
        setIsEditable(false)
      }
    }

    isEditAble()
  }, [userid, currentEmail])

  // Toggles editable state of form fields
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
      currentClasses: !prevFields.currentClasses
    }))
  }

  // Saves the updated profile information to Supabase
  const handleSave = async () => {
    try {
      // Update the user's profile in Supabase with the new values
      const { data, error } = await supabase
        .from('Brothers')
        .update([
          {
            firstname,
            lastname,
            year,
            major,
            phone,
            linkedin: linkedin,
            classes: currentClasses
          }
        ])
        .eq('email', email)

      if (!error) {
        console.log('Profile updated successfully')

        // Optionally reset editableFields state to hide input fields
        setEditableFields({
          firstname: false,
          lastname: false,
          year: false,
          major: false,
          phone: false,
          linkedin: false,
          imageUrl: false,
          currentClasses: false
        })

        // Upload the new profile photo if a file is selected
        if (profileImage) {
          const fileName = `${userid}.jpeg`
          const { data: uploadData, error: uploadError } =
            await supabase.storage
              .from('brothers')
              .upload(fileName, profileImage, {
                cacheControl: '3600',
                contentType: 'image/jpeg',
                upsert: true
              })

          if (!uploadError) {
            console.log('Profile photo uploaded successfully')
            setImageUrl(URL.createObjectURL(profileImage))
            setProfileImage(null) // Reset profileImage after successful upload
          } else {
            console.error('Error uploading profile photo:', uploadError.message)
          }
        }
      } else {
        console.error('Error updating profile:', error.message)
      }
    } catch (error) {
      console.error('Error updating profile:', error.message)
    }
  }

  const handleImageChange = e => {
    const file = e.target.files[0]

    // Check if the file is of type image/jpeg
    if (file && file.type === 'image/jpeg') {
      const image = URL.createObjectURL(file)
      setProfileImage(file)
      setProfileImageUrl(image)
    } else {
      console.error('Invalid file format. Please select a JPEG image.')
    }
  }

  // Updates a specific class in the currentClasses array
  const handleCurrentClassChange = (index, value) => {
    const updatedClasses = [...currentClasses]
    updatedClasses[index] = value
    setCurrentClasses(updatedClasses)
  }

  // Deletes a class from the currentClasses array
  const handleDeleteClass = index => {
    const updatedClasses = [...currentClasses]
    updatedClasses.splice(index, 1)
    setCurrentClasses(updatedClasses)
  }
  // Adds a new empty class to the currentClasses array so that user can edit it to add new class
  const handleAddClass = () => {
    console.log(classesArray);
    const classesArray = currentClasses || [] // Use empty array if currentClasses is null
    const updatedClasses = [...classesArray, ''] // Add an empty string for a new class
    setCurrentClasses(updatedClasses)
  }

  return (
    <div className='flex md:flex-row flex-col flex-grow border-b-2 border-[#a3000020]'>
      <BroNavBar isPledge={false} />
      <div className='flex-grow'>
        <div className='flex flex-col items-center bg-gray-100 p-2 mb-4 h-full'>
          <div className='flex flex-col items-center w-full'>
            {profileImage ? (
              <div className='mb-2 w-40 h-40'>
                <img
                  src={profileImageUrl}
                  alt='ProfileImage'
                  className='rounded-full w-full h-full object-cover'
                />
              </div>
            ) : // If no temporary image, check for imageUrl
            imageUrl ? (
              <div className='mb-2 w-40 h-40'>
                <img
                  src={imageUrl}
                  alt='ProfileBroken'
                  className='rounded-full w-full h-full object-cover'
                />
              </div>
            ) : (
              // If no imageUrl, display the default logo
              <div className='mb-2 w-32 h-34'>
                <Image
                  src={thtlogo}
                  alt='logo'
                  className='rounded-full w-full h-full object-cover'
                />
              </div>
            )}
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
          <div className='flex flex-col items-center w-full'>
            <div className='flex flex-col items-center justify-evenly w-full pb-2'>
              <div className='flex flex-col md:flex-row items-center my-4'>
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
              <div className='flex flex-col items-center justify-evenly w-full'>
                <div className='flex flex-row items-center justify-evenly w-1/3'>
                  <div className='flex flex-col md:flex-row items-center justify-evenly w-1/3'>
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

                <div className='flex flex-col items-center p-2'>
                  <p className='text-lg font-semibold mb-1'>Roll</p>
                  <p className='text-lg'>{roll}</p>
                </div>
                <div className='flex flex-col items-center p-2'>
                  <p className='text-lg font-semibold mb-1'>Email</p>
                  <p className='text-lg'>{email}</p>
                </div>

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
                <div className='flex flex-col items-center p-2 w-full'>
                  <p className='text-lg font-semibold'>Current Classes</p>
                  {editableFields.currentClasses && isEditable ? (
                    <div className='flex flex-col'>
                      <p className='text-center mb-2 text-red-500'>
                        Please add class name in this format (EECS 482, MECHENG
                        211, AEROSP 200){' '}
                      </p>
                      <div className='grid grid-cols-3 gap-4'>
                        {currentClasses &&
                          currentClasses.map((className, index) => (
                            <div
                              key={index}
                              className='flex flex-row items-center'
                            >
                              <button
                                onClick={() => handleDeleteClass(index)}
                                className='text-red-500 hover:text-red-700 font-semibold mr-2'
                              >
                                X
                              </button>
                              <input
                                type='text'
                                placeholder={`Class ${index + 1}`}
                                value={className}
                                onChange={e =>
                                  handleCurrentClassChange(
                                    index,
                                    e.target.value
                                  )
                                }
                                className='whitespace-nowrap w-full border-2 border-[#8b000070] text-center'
                              />
                            </div>
                          ))}
                      </div>
                      <button
                        onClick={handleAddClass}
                        className='text-green-500 hover:text-green-700 font-semibold mt-4'
                      >
                        Add Class
                      </button>
                    </div>
                  ) : (
                    <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
                      {currentClasses &&
                        currentClasses.map((className, index) => (
                          <div
                            key={index}
                            className='text-lg text-center whitespace-nowrap'
                          >
                            {className}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>

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
