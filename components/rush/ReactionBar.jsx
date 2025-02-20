import React, { useState, useEffect } from 'react'
import supabase from '@/supabase'

// React-icons
import {
  FaThumbsUp, FaRegThumbsUp,
  FaThumbsDown, FaRegThumbsDown,
  FaStar, FaRegStar
} from 'react-icons/fa'

/**
 * ReactionBar is a reusable component to handle likes, dislikes, and stars.
 * @param {Object} props
 *   - uniqname: The rushee's unique identifier (string)
 *   - brotherID: ID of the current logged-in user/brother (string)
 *   - likes, dislikes, stars: Arrays of user IDs who have liked, disliked, or starred
 *
 * Usage:
 *   <ReactionBar
 *     uniqname="katemcg"
 *     brotherID="johndoe"
 *     likes={["johndoe","..."]}
 *     dislikes={[]}
 *     stars={["bro2", "..."]}
 *   />
 */
export default function ReactionBar({
  uniqname,
  brotherID,
  likes = [],
  dislikes = [],
  stars = []
}) {
  // Local state so the UI updates immediately on toggle
  const [localLikes, setLikes] = useState(likes || [])
  const [localDislikes, setDislikes] = useState(dislikes || [])
  const [localStars, setStars] = useState(stars || [])

  // Check if the current user has already liked, disliked, or starred
  const isLiked = localLikes.includes(brotherID)
  const isDisliked = localDislikes.includes(brotherID)
  const isStarred = localStars.includes(brotherID)

  // Toggle "like"
  async function handleLike(e) {
    e.stopPropagation()  // prevent parent onClick
    let updatedLikes
    if (isLiked) {
      updatedLikes = localLikes.filter((id) => id !== brotherID)
    } else {
      updatedLikes = [...localLikes, brotherID]
      // Optional: remove from dislikes if you only allow one reaction
      // setDislikes(localDislikes.filter((id) => id !== brotherID))
    }

    const { data, error } = await supabase
      .from('Rushees')
      .update({ likes: updatedLikes })
      .eq('uniqname', uniqname)
      .single()

    if (!error) {
      setLikes(updatedLikes)
    }
  }

  // Toggle "dislike"
  async function handleDislike(e) {
    e.stopPropagation()
    let updatedDislikes
    if (isDisliked) {
      updatedDislikes = localDislikes.filter((id) => id !== brotherID)
    } else {
      updatedDislikes = [...localDislikes, brotherID]
      // Optional: remove from likes if you only allow one reaction
      // setLikes(localLikes.filter((id) => id !== brotherID))
    }

    const { data, error } = await supabase
      .from('Rushees')
      .update({ dislikes: updatedDislikes })
      .eq('uniqname', uniqname)
      .single()

    if (!error) {
      setDislikes(updatedDislikes)
    }
  }

  // Toggle "star"
  async function handleStar(e) {
    e.stopPropagation()
    let updatedStars
    if (isStarred) {
      updatedStars = localStars.filter((id) => id !== brotherID)
    } else {
      updatedStars = [...localStars, brotherID]
    }

    const { data, error } = await supabase
      .from('Rushees')
      .update({ stars: updatedStars })
      .eq('uniqname', uniqname)
      .single()

    if (!error) {
      setStars(updatedStars)
    }
  }

  return (
    <div className="bg-gray-50 px-4 py-2 flex items-center justify-around">
      {/* LIKE */}
      <div className="flex items-center space-x-1 cursor-pointer" onClick={handleLike}>
        {isLiked ? (
          <FaThumbsUp className="text-[#8B0000] text-2xl" />
        ) : (
          <FaRegThumbsUp className="text-[#8B0000] text-2xl" />
        )}
        <span className="text-lg font-semibold text-gray-700">
          {localLikes.length}
        </span>
      </div>

      {/* DISLIKE */}
      <div className="flex items-center space-x-1 cursor-pointer" onClick={handleDislike}>
        {isDisliked ? (
          <FaThumbsDown className="text-[#8B0000] text-2xl" />
        ) : (
          <FaRegThumbsDown className="text-[#8B0000] text-2xl" />
        )}
        <span className="text-lg font-semibold text-gray-700">
          {localDislikes.length}
        </span>
      </div>

      {/* STAR */}
      <div className="flex items-center space-x-1 cursor-pointer" onClick={handleStar}>
        {isStarred ? (
          <FaStar className="text-[#8B0000] text-2xl" />
        ) : (
          <FaRegStar className="text-[#8B0000] text-2xl" />
        )}
        <span className="text-lg font-semibold text-gray-700">
          {localStars.length}
        </span>
      </div>
    </div>
  )
}
