import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import supabase from '@/supabase'
import Image from 'next/image'
import thtlogo from '../../public/tht-logo.png'

// Import the new ReactionBar
import ReactionBar from './ReactionBar'

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

  function handleCardClick() {
    router.push(`/brothers/rushees/${uniqname}`)
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

      {/* Reusable ReactionBar */}
      <ReactionBar
        uniqname={uniqname}
        brotherID={brotherID}
        likes={likes}
        dislikes={dislikes}
        stars={stars}
      />
    </div>
  )
}
