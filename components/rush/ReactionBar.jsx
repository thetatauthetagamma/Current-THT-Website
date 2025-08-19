import React, { useState, useEffect } from 'react'
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

  // We'll store a dictionary: { [uniqname]: { firstname, lastname } }
  const [brothersMap, setBrothersMap] = useState({})

  // One-time fetch of all brothers from the "Brothers" table
  useEffect(() => {
    const fetchAllBrothers = async () => {
      const { data, error } = await supabase
        .from('Brothers')
        .select('userid, firstname, lastname')

      if (error) {
        console.error('Error fetching all brothers:', error)
        return
      }
      if (data) {
        // Build a dictionary: { uniqname: { firstname, lastname } }
        const map = {}
        data.forEach(bro => {
          map[bro.userid] = {
            firstname: bro.firstname,
            lastname: bro.lastname
          }
        })
        setBrothersMap(map)
      }
    }
    fetchAllBrothers()
  }, [])

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
    if (isLiked) {
      updatedLikes = localLikes.filter(id => id !== brotherID)
    } else {
      updatedLikes = [...localLikes, brotherID]
      // If you want to automatically remove from localDislikes:
      setDislikes(d => d.filter(id => id !== brotherID))
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

  // ─────────────────────────────────────────────────────────
  // 2) Toggling "dislike"
  // ─────────────────────────────────────────────────────────
  async function handleDislike(e) {
    e.stopPropagation()
    let updatedDislikes
    if (isDisliked) {
      updatedDislikes = localDislikes.filter(id => id !== brotherID)
    } else {
      updatedDislikes = [...localDislikes, brotherID]
      // If you want to automatically remove from localLikes:
      setLikes(l => l.filter(id => id !== brotherID))
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

  // This helper function returns a small React element
  // showing "No X yet" or a multiline list of each brother
  function renderNamesOrNone(uniqnameArray, label) {
    if (!uniqnameArray || uniqnameArray.length === 0) {
      return <p>No {label} yet</p>
    }

    return (
      <div>
        <p className="font-bold mb-1">{label} by:</p>
        {uniqnameArray.map(u => {
          const brother = brothersMap[u]
          if (brother) {
            return (
              <p key={u}>
                {brother.firstname} {brother.lastname}
              </p>
            )
          } else {
            // Fallback if we didn't find that brother in brothersMap
            return <p key={u}>{u}</p>
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
