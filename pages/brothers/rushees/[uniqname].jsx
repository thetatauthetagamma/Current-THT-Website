import React, { useEffect, useState } from 'react'
import supabase from '@/supabase'
import thtlogo from '../../public/tht-logo.png'
import Image from 'next/image'
import BroNavBar from '@/components/BroNavBar' // Custom navigation bar component
import { useRouter } from 'next/router' // Next.js hook for router manipulation

export default function RusheeProfile(){
      const router = useRouter()
      const [pledgeID, setPledgeID] = useState('')
      // Fetches the profile ID from URL query parameters
      useEffect(() => {
        const fetchUnique = async () => {
          const queryParams = router.query
          setPledgeID(queryParams.uniqname)
        }
    
        fetchUnique()
      }, [router.query.uniqname])

    return (
        <div>
            <h1>Rushee Profile</h1>
        </div>
    )
}