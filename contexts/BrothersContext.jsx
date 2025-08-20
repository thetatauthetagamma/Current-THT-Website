import React, { createContext, useContext, useEffect, useState } from 'react'
import supabase from '@/supabase'


const BrothersContext = createContext()

/**
 * BrothersProvider: Fetches and provides brother data to all child components
 * This component should wrap any page that contains ReactionBar components.
 */
export function BrothersProvider({ children }) {
    // State to hold the brothers data
    const [brothersMap, setBrothersMap] = useState({})
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        // Fetch all brothers data once
        const fetchAllBrothers = async () => {
            console.log('🔄 BrothersContext: Fetching all brothers data (single API call)')

            try {
                const { data, error } = await supabase
                    .from('Brothers')
                    .select('userid, firstname, lastname')

                if (error) {
                    setError(error)
                    return
                }

                if (data) {
                    const map = {}
                    data.forEach(brother => {
                        map[brother.userid] = {
                            firstname: brother.firstname,
                            lastname: brother.lastname
                        }
                    })
                    setBrothersMap(map)
                }
            } catch (err) {
                setError(err)
            } finally {
                setIsLoading(false)
            }
        }

        fetchAllBrothers()
    }, []) // Empty dependency array = run once on mount

    // Any component wrapped by this provider can access:
    // - brothersMap: { uniqname: { firstname, lastname } }
    // - isLoading: boolean indicating if data is still loading
    // - error: any error that occurred during fetch

    const contextValue = {
        brothersMap,
        isLoading,
        error
    }

    return (
        <BrothersContext.Provider value={contextValue}>
            {children}
        </BrothersContext.Provider>
    )
}

/**
 * useBrothers: Custom hook to access brothers data
 * 
 * This hook provides a clean interface for components to access brothers data.
 * Usage: const { brothersMap, isLoading, error } = useBrothers()
 */
export function useBrothers() {
    const context = useContext(BrothersContext)

    if (context === undefined) {
        throw new Error('useBrothers must be used within a BrothersProvider')
    }

    return context
}

/**
 * Helper function: Get brother's full name by uniqname
 * 
 * This is a convenience function that components can use to get a formatted name.
 * Returns "John Doe" or falls back to the uniqname if not found.
 */
export function useBrotherName(uniqname) {
    const { brothersMap } = useBrothers()

    if (!uniqname || !brothersMap[uniqname]) {
        return uniqname || 'Unknown'
    }

    const brother = brothersMap[uniqname]
    return `${brother.firstname} ${brother.lastname}`
}
