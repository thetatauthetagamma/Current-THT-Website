import React, { useState, useEffect } from 'react'
import { useBrothers } from '@/contexts/BrothersContext'
import supabase from '@/supabase'

// React-icons
import {
  FaThumbsUp, FaRegThumbsUp,
  FaThumbsDown, FaRegThumbsDown,
  FaStar, FaRegStar
} from 'react-icons/fa'

/**
 * ReactionBar is a reusable component that:
 *  - Lets you "like," "dislike," or "star" a Rushee.
 *  - Shows a custom tooltip (no browser delay) with FIRST+LAST name of
 *    each brother who performed that reaction.
 *
 * The "likes", "dislikes", and "stars" arrays in the Rushees table
 * still store each brother's uniqname, but we look up their full names
 * from "Brothers" to display them in a multiline tooltip.
 */
export default function ReactionBar({
  uniqname,     // The rushee's unique identifier
  brotherID,    // The currently logged-in user's uniqname
  likes = [],   // Array of uniqnames who liked the rushee
  dislikes = [],// Array of uniqnames who disliked the rushee
  stars = []    // Array of uniqnames who starred the rushee
}) {
  // Local state so the UI updates immediately on toggle
  const [localLikes, setLikes] = useState(likes || [])
  const [localDislikes, setDislikes] = useState(dislikes || [])
  const [localStars, setStars] = useState(stars || [])

  const { brothersMap, isLoading: brothersLoading } = useBrothers()

  // Check if the current user has already liked, disliked, or starred
  const isLiked = localLikes.includes(brotherID)
  const isDisliked = localDislikes.includes(brotherID)
  const isStarred = localStars.includes(brotherID)

  // ─────────────────────────────────────────────────────────
  // 1) Toggling "like"
  // ─────────────────────────────────────────────────────────
  async function handleLike(e) {
    e.stopPropagation() // prevent parent onClick
    let updatedLikes
    let updatedDislikes = localDislikes

    if (isLiked) {
      updatedLikes = localLikes.filter(id => id !== brotherID)
    } else {
      updatedLikes = [...localLikes, brotherID]
      // If you want to automatically remove from localDislikes:
      updatedDislikes = localDislikes.filter(id => id !== brotherID)
      setDislikes(updatedDislikes)
    }

    const { data, error } = await supabase
      .from('Rushees')
      .update({
        likes: updatedLikes,
        dislikes: updatedDislikes
      })
      .eq('uniqname', uniqname)
      .single()

    if (!error) {
      setLikes(updatedLikes)
    }
  }

  // ─────────────────────────────────────────────────────────
  // 2) Toggling "dislike"
  // ─────────────────────────────────────────────────────────
  async function handleDislike(e) {
    e.stopPropagation()
    let updatedDislikes
    let updatedLikes = localLikes

    if (isDisliked) {
      updatedDislikes = localDislikes.filter(id => id !== brotherID)
    } else {
      updatedDislikes = [...localDislikes, brotherID]
      // If you want to automatically remove from localLikes:
      updatedLikes = localLikes.filter(id => id !== brotherID)
      setLikes(updatedLikes)
    }

    const { data, error } = await supabase
      .from('Rushees')
      .update({
        dislikes: updatedDislikes,
        likes: updatedLikes
      })
      .eq('uniqname', uniqname)
      .single()

    if (!error) {
      setDislikes(updatedDislikes)
    }
  }

  // ─────────────────────────────────────────────────────────
  // 3) Toggling "star"
  // ─────────────────────────────────────────────────────────
  async function handleStar(e) {
    e.stopPropagation()
    let updatedStars
    if (isStarred) {
      updatedStars = localStars.filter(id => id !== brotherID)
      setDislikes(d => d.filter(id => id !== brotherID))
    } else {
      updatedStars = [...localStars, brotherID]
      setDislikes(d => d.filter(id => id !== brotherID))
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

  // ─────────────────────────────────────────────────────────────────────────────
  // This function takes an array of uniqnames and displays their full names
  // Uses the shared brothersMap from context for instant lookups
  // ─────────────────────────────────────────────────────────────────────────────
  function renderNamesOrNone(uniqnameArray, label) {
    if (!uniqnameArray || uniqnameArray.length === 0) {
      return <p>No {label} yet</p>
    }

    return (
      <div>
        <p className="font-bold mb-1">{label} by:</p>
        {uniqnameArray.map(uniqname => {
          const brother = brothersMap[uniqname]

          if (brother) {
            return (
              <p key={uniqname}>
                {brother.firstname} {brother.lastname}
              </p>
            )
          } else {
            // fallback is brother not yet loaded
            return <p key={uniqname}>{uniqname}</p>
          }
        })}
      </div>
    )
  }

  return (
    <div className="bg-gray-50 px-4 py-2 flex items-center justify-around overflow-visible">
      {/* LIKE */}
      <div
        className="relative group flex items-center space-x-1 cursor-pointer overflow-visible"
        onClick={handleLike}
      >
        <div
          className="absolute hidden group-hover:block bg-gray-800 text-white text-xs px-2 py-1 rounded z-50
                     top-0 left-1/2 -translate-x-1/2 -translate-y-full mb-1 whitespace-nowrap"
          style={{ whiteSpace: 'pre' }}
        >
          {renderNamesOrNone(localLikes, 'Liked')}
        </div>
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
      <div
        className="relative group flex items-center space-x-1 cursor-pointer overflow-visible"
        onClick={handleDislike}
      >
        <div
          className="absolute hidden group-hover:block bg-gray-800 text-white text-xs px-2 py-1 rounded z-50
                     top-0 left-1/2 -translate-x-1/2 -translate-y-full mb-1 whitespace-nowrap"
          style={{ whiteSpace: 'pre' }}
        >
          {renderNamesOrNone(localDislikes, 'Disliked')}
        </div>
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
      <div
        className="relative group flex items-center space-x-1 cursor-pointer overflow-visible"
        onClick={handleStar}
      >
        <div
          className="absolute hidden group-hover:block bg-gray-800 text-white text-xs px-2 py-1 rounded z-50
                     top-0 left-1/2 -translate-x-1/2 -translate-y-full mb-1 whitespace-nowrap"
          style={{ whiteSpace: 'pre' }}
        >
          {renderNamesOrNone(localStars, 'Starred')}
        </div>
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
