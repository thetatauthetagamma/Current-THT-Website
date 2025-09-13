import React, { createContext, useContext, useState, useEffect } from 'react'
import supabase from '../supabase'

const StarCountContext = createContext()

export const useStarCount = () => {
  const context = useContext(StarCountContext)
  if (!context) {
    throw new Error('useStarCount must be used within a StarCountProvider')
  }
  return context
}

export const StarCountProvider = ({ children, brotherID }) => {
  const [starCount, setStarCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [allRusheeStars, setAllRusheeStars] = useState({})

  // Fetch all rushee star data once
  useEffect(() => {
    const fetchAllStarData = async () => {
      if (!brotherID) {
        setIsLoading(false)
        return
      }

      try {
        const { data: rushees, error } = await supabase
          .from('Rushees')
          .select('uniqname, stars')
          .eq('active', true)

        if (!error && rushees) {
          // Create a map of rushee -> stars array
          const starMap = {}
          let brotherStarCount = 0

          rushees.forEach(rushee => {
            starMap[rushee.uniqname] = rushee.stars || []
            if (rushee.stars && rushee.stars.includes(brotherID)) {
              brotherStarCount++
            }
          })

          setAllRusheeStars(starMap)
          setStarCount(brotherStarCount)
        }
      } catch (err) {
        console.error('Error fetching star data:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAllStarData()
  }, [brotherID])

  // Function to update star count when a brother stars/unstars a rushee
  const updateStarCount = (rusheeUniqname, isStarring) => {
    if (isStarring) {
      // Check if brother can star more (limit of 3)
      if (starCount >= 3) {
        return false // Cannot star more
      }
      setStarCount(prev => prev + 1)
      setAllRusheeStars(prev => ({
        ...prev,
        [rusheeUniqname]: [...(prev[rusheeUniqname] || []), brotherID]
      }))
    } else {
      // Unstarring
      setStarCount(prev => Math.max(0, prev - 1))
      setAllRusheeStars(prev => ({
        ...prev,
        [rusheeUniqname]: (prev[rusheeUniqname] || []).filter(id => id !== brotherID)
      }))
    }
    return true // Operation allowed
  }

  // Function to check if brother can star more rushees
  const canStarMore = () => starCount < 3

  // Function to check if a specific rushee is starred by this brother
  const isRusheeStarred = (rusheeUniqname) => {
    const stars = allRusheeStars[rusheeUniqname] || []
    return stars.includes(brotherID)
  }

  // Function to get stars for a specific rushee
  const getRusheeStars = (rusheeUniqname) => {
    return allRusheeStars[rusheeUniqname] || []
  }

  const value = {
    starCount,
    isLoading,
    canStarMore,
    updateStarCount,
    isRusheeStarred,
    getRusheeStars,
    maxStars: 3
  }

  return (
    <StarCountContext.Provider value={value}>
      {children}
    </StarCountContext.Provider>
  )
}
