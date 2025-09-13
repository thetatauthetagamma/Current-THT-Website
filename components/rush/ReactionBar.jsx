import React, { useState, useEffect } from 'react'
import { useBrothers } from '@/contexts/BrothersContext'
import { useStarCount } from '@/contexts/StarCountContext'
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
 *  - Star button is only clickable after a specified unlock date.
 *
 * Props:
 *  - starUnlockDate: ISO string or Date object for when star button becomes available
 *    - If null/undefined, star button is always enabled
 *    - If set, star button is disabled until that date
 *
 * The "likes", "dislikes", and "stars" arrays in the Rushees table
 * still store each brother's uniqname, but we look up their full names
 * from "Brothers" to display them in a multiline tooltip.
 */
export default function ReactionBar({
  uniqname,
  brotherID,
  likes = [],
  dislikes = [],
  stars = [],
  isAdmin = false,
  starUnlockDate = "2025-09-15" // ISO string or Date object for when star button becomes available
}) {
  // Local state so the UI updates immediately on toggle
  const [localLikes, setLikes] = useState(likes || [])
  const [localDislikes, setDislikes] = useState(dislikes || [])
  const [localStars, setStars] = useState(stars || [])
  const { brothersMap, isLoading: brothersLoading } = useBrothers()
  const { canStarMore, updateStarCount, isRusheeStarred, getRusheeStars } = useStarCount()

  const isLiked = localLikes.includes(brotherID)
  const isDisliked = localDislikes.includes(brotherID)
  // Use context to determine if starred, with fallback to local state
  const isStarred = isRusheeStarred ? isRusheeStarred(uniqname) : localStars.includes(brotherID)
  
  // Use context stars with fallback to props
  const currentStars = getRusheeStars ? getRusheeStars(uniqname) : stars

  // Check if star button should be enabled based on date
  const isStarEnabled = () => {
    if (!starUnlockDate) return true // If no date specified, always enabled
    
    const unlockDate = new Date(starUnlockDate)
    const currentDate = new Date()
    
    return currentDate >= unlockDate
  }


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
  // 3) Toggling "star" - with date restriction and limit check
  // ─────────────────────────────────────────────────────────
  async function handleStar(e) {
    e.stopPropagation()
    
    // Check if star button is enabled based on date
    if (!isStarEnabled()) {
      return // Exit early if star button is not yet enabled
    }

    const willBeStar = !isStarred
    
    // Check star limit using context
    if (willBeStar && !canStarMore()) {
      // Show a brief notification that limit is reached
      console.log('Star limit reached (3/3)')
      return
    }

    // Update context first (optimistic update)
    const canUpdate = updateStarCount(uniqname, willBeStar)
    if (!canUpdate) {
      return // Context prevented the update
    }

    let updatedStars
    if (isStarred) {
      updatedStars = currentStars.filter(id => id !== brotherID)
      setDislikes(d => d.filter(id => id !== brotherID))
    } else {
      updatedStars = [...currentStars, brotherID]
      setDislikes(d => d.filter(id => id !== brotherID))
    }

    const { data, error } = await supabase
      .from('Rushees')
      .update({ stars: updatedStars })
      .eq('uniqname', uniqname)
      .single()

    if (!error) {
      setStars(updatedStars)
    } else {
      // If database update failed, revert the context update
      updateStarCount(uniqname, !willBeStar)
      console.error('Failed to update star in database:', error)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // This function takes an array of uniqnames and displays their full names
  // Uses the shared brothersMap from context for instant lookups
  // Only shows names if user is admin, otherwise shows count only
  // ─────────────────────────────────────────────────────────────────────────────
  function renderNamesOrNone(uniqnameArray, label) {
    if (!uniqnameArray || uniqnameArray.length === 0) {
      return <p>No {label} yet</p>
    }

    // If not admin, only show count
    if (!isAdmin) {
      return <p>{uniqnameArray.length} {label}</p>
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
        className={`relative group flex items-center space-x-1 overflow-visible ${
          isStarEnabled() && (isStarred || canStarMore()) ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
        }`}
        onClick={isStarEnabled() && (isStarred || canStarMore()) ? handleStar : undefined}
      >
        <div
          className="absolute hidden group-hover:block bg-gray-800 text-white text-xs px-2 py-1 rounded z-50
                     top-0 left-1/2 -translate-x-1/2 -translate-y-full mb-1 whitespace-nowrap"
          style={{ whiteSpace: 'pre' }}
        >
          {!isStarEnabled() 
            ? <p>Unlocks {new Date(starUnlockDate).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}</p>
            : !isStarred && !canStarMore()
            ? <p>Star limit reached (3/3)</p>
            : renderNamesOrNone(currentStars, 'Starred')
          }
        </div>
        {isStarred ? (
          <FaStar className="text-[#8B0000] text-2xl" />
        ) : (
          <FaRegStar className="text-[#8B0000] text-2xl" />
        )}
        <span className="text-lg font-semibold text-gray-700">
          {currentStars.length}
        </span>
      </div>
    </div>
  )
}

