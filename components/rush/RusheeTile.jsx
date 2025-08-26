import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import supabase from '@/supabase'
import Image from 'next/image'
import thtlogo from '../../public/tht-logo.png'

// Import the new ReactionBar
import ReactionBar from './ReactionBar'
import { FaRegTrashCan } from "react-icons/fa6";

export default function RusheeTile({
  uniqname,
  firstname,
  lastname,
  pronouns,
  likes = [],
  dislikes = [],
  stars = [],
  brotherID
}) {
  const router = useRouter()
  const [imageUrl, setImageUrl] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false) // Loading state for delete

  // Fetch the image from Supabase storage
  useEffect(() => {
    const fetchRusheeImage = async () => {
      if (uniqname) {
        const { data: ImageData, error } = await supabase.storage
          .from('rushees')
          .download(`${uniqname}.jpeg`)

        if (!error && ImageData) {
          setImageUrl(URL.createObjectURL(ImageData))
        }
      }
    }
    fetchRusheeImage()
  }, [uniqname])

  useEffect(() => {
    const fetchAdminRole = async () => {
      if (!brotherID) return
      const { data, error } = await supabase
        .from('Brothers')
        .select('adminrole')
        .eq('userid', brotherID)
        .single()

      if (!error && data) {
        setIsAdmin(data.adminrole === 'dev' || data.adminrole === 'rush')
      } else {
        console.error('Error fetching admin role:', error)
      }
    }
    fetchAdminRole()
  }, [brotherID])

  function handleCardClick() {
    router.push(`/brothers/rushees/${uniqname}`)
  }

  const handleDelete = async (event) => {
    event.stopPropagation() // Prevents triggering the card click
    if (!uniqname) return

    const confirmDelete = window.confirm(
      `Are you sure you want to remove ${firstname} ${lastname}? This action will mark them as inactive but not delete them permanently. If you ever need to recover a rushees data before the end of the semester, reach out to web committee.`
    )

    if (!confirmDelete) return // User canceled the action

    setIsDeleting(true)

    const { error } = await supabase
      .from('Rushees')
      .update({ active: false })
      .eq('uniqname', uniqname)

    setIsDeleting(false)

    if (error) {
      console.error('Error marking rushee as inactive:', error)
      alert('Error removing rushee. Check console.')
    } else {
      alert(`${firstname} ${lastname} has been marked as inactive.`)
    }
  }

  return (
    <div
      className="max-w-xs w-full bg-white rounded-lg shadow-md 
                 overflow-hidden transition-transform transform 
                 hover:scale-105 cursor-pointer "
      onClick={handleCardClick}
    >
      {/* TOP SECTION (IMAGE + NAME) */}
      <div className="p-4 flex flex-col items-center">
        <div className="w-32 h-32 mb-3">
          {imageUrl ? (
            <img
              className="rounded-full w-full h-full object-cover"
              src={imageUrl}
              alt={`${firstname} ${lastname}`}
            />
          ) : (
            <Image
              className="rounded-full w-full h-full object-cover"
              src={thtlogo}
              alt="Default logo"
            />
          )}
        </div>

        <h2 className="text-xl font-semibold text-gray-800 text-center">
          {firstname} {lastname}
        </h2>
        <h3 className="text-sm text-gray-800 text-center">
          {pronouns}
        </h3>
      </div>
      {isAdmin && (
        <button
          className="absolute top-2 right-2 bg-red-800 text-white p-2 rounded-full 
                     hover:bg-red-900 transition flex items-center justify-center"
          onClick={handleDelete}
          disabled={isDeleting}
          title="Remove Rushee"
        >
          <FaRegTrashCan className="w-5 h-5" />
        </button>
      )}
      {/* Reusable ReactionBar */}
      <ReactionBar
        uniqname={uniqname}
        brotherID={brotherID}
        likes={likes}
        dislikes={dislikes}
        stars={stars}
        isAdmin={isAdmin}
      />
    </div>
  )
}
