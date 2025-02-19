import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import supabase from '@/supabase'
import Image from 'next/image'
import thtlogo from '../../public/tht-logo.png'

// React-icons
import {
  FaThumbsUp, FaRegThumbsUp,
  FaThumbsDown, FaRegThumbsDown,
  FaStar, FaRegStar
} from 'react-icons/fa'

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
  
  // Keep local copies of the arrays so we can setState after toggling
  const [localLikes, setLikes] = useState(likes || [])
  const [localDislikes, setDislikes] = useState(dislikes || [])
  const [localStars, setStars] = useState(stars || [])

  // Fetch current user ID from your app/auth context (example only)
//   const currentUserId = 'abc123' // Replace this with the real user ID

  // Check if user has already liked/disliked/starred
  const isLiked = localLikes.includes(brotherID)
  const isDisliked = localDislikes.includes(brotherID)
  const isStarred = localStars.includes(brotherID)

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

  // Toggle helpers
  async function handleLike() {
    let updated = []
    if (isLiked) {
      updated = localLikes.filter((id) => id !== brotherID)
    } else {
      updated = [...localLikes, brotherID]
    }

    const { data, error } = await supabase
      .from('Rushees')
      .update({ likes: updated })
      .eq('uniqname', uniqname)
      .single()

    if (!error) setLikes(updated)
  }

  async function handleDislike() {
    let updated = []
    if (isDisliked) {
      updated = localDislikes.filter((id) => id !== brotherID)
    } else {
      updated = [...localDislikes, brotherID]
      // Optionally remove from likes if you want to allow only one reaction
      // setLikes(localLikes.filter(id => id !== currentUserId))
    }

    const { data, error } = await supabase
      .from('Rushees')
      .update({ dislikes: updated })
      .eq('uniqname', uniqname)
      .single()

    if (!error) setDislikes(updated)
  }

  async function handleStar() {
    let updated = []
    if (isStarred) {
      updated = localStars.filter((id) => id !== brotherID)
    } else {
      updated = [...localStars, brotherID]
    }

    const { data, error } = await supabase
      .from('Rushees')
      .update({ stars: updated })
      .eq('uniqname', uniqname)
      .single()

    if (!error) setStars(updated)
  }

  // Card click to see full details
  function handleCardClick() {
    // e.g., open a full page for comments, etc.
    router.push(`/rushees/${uniqname}`)
  }

  return (
    <div
      className="max-w-xs w-full bg-white rounded-lg shadow-md 
                 overflow-hidden transition-transform transform 
                 hover:scale-105 cursor-pointer"
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

      {/* ACTION ROW (ICONS + COUNTS) */}
      {/* We wrap icon + count together in a small flex so they appear side-by-side. */}
      <div className="bg-gray-50 px-4 py-2 flex items-center justify-around">
        {/* LIKE */}
        <div
          className="flex items-center space-x-1"
          onClick={(e) => {
            e.stopPropagation(); // Don’t trigger card click
            handleLike();
          }}
        >
          {isLiked ? (
            <FaThumbsUp className="text-[#8B0000] text-2xl cursor-pointer" />
          ) : (
            <FaRegThumbsUp className="text-[#8B0000] text-2xl cursor-pointer" />
          )}
          <span className="text-lg font-semibold text-gray-700">
            {localLikes.length}
          </span>
        </div>

        {/* DISLIKE */}
        <div
          className="flex items-center space-x-1"
          onClick={(e) => {
            e.stopPropagation();
            handleDislike();
          }}
        >
          {isDisliked ? (
            <FaThumbsDown className="text-[#8B0000] text-2xl cursor-pointer" />
          ) : (
            <FaRegThumbsDown className="text-[#8B0000] text-2xl cursor-pointer" />
          )}
          <span className="text-lg font-semibold text-gray-700">
            {localDislikes.length}
          </span>
        </div>

        {/* STAR */}
        <div
          className="flex items-center space-x-1"
          onClick={(e) => {
            e.stopPropagation();
            handleStar();
          }}
        >
          {isStarred ? (
            <FaStar className="text-[#8B0000] text-2xl cursor-pointer" />
          ) : (
            <FaRegStar className="text-[#8B0000] text-2xl cursor-pointer" />
          )}
          <span className="text-lg font-semibold text-gray-700">
            {localStars.length}
          </span>
        </div>
      </div>
    </div>
  )
}
