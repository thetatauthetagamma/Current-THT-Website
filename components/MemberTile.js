import React from 'react'
import thtlogo from '../public/tht-logo.png'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import supabase from '../supabase'
import linkdenLogo from '../public/linked-in.svg'
import { Router, useRouter } from 'next/router'
import { safeLinkedInUrl } from '@/utils/alumni'

export default function MemberTile ({
  userid,
  firstname,
  lastname,
  year,
  major,
  roll,
  phone,
  email,
  linkedin,
  bio
}) {
  const router = useRouter()
  const linkedinUrl = safeLinkedInUrl(linkedin)
  const [imageUrl, setImageUrl] = useState('')

  useEffect(() => {
    const fetchBrotherImage = async () => {
      if (userid) {
        const { data: ImageData, error } = await supabase.storage
          .from('brothers')
          .download(`${userid}.jpeg`)

        if (!error) {
          setImageUrl(URL.createObjectURL(ImageData))
        }
      }
    }

    fetchBrotherImage()
  }, [])

  //if you click on them it takes you to the members page
  function handleClick () {
    router.push(`/members/${userid}`)
  }

  return (
    <div
      onClick={handleClick}
      className='flex flex-col md:flex-row items-center bg-gray-100 p-2 rounded-2xl mb-4'
    >
      <div className='flex flex-col items-center w-3/12'>
        {imageUrl ? (
          <div className='mb-2 w-40 h-40'>
            <img
              src={imageUrl}
              alt='Pledge'
              className='rounded-full w-full h-full object-cover'
            />
          </div>
        ) : (
          <div className='mb-2 w-32 h-34'>
            <Image
              src={thtlogo}
              alt='logo'
              className='rounded-full w-full h-full object-cover'
            />
          </div>
        )}
      </div>
      <div className='flex flex-col items-center w-9/12'>
        <div className='flex flex-col items-center justify-evenly w-full pb-2'>
          <div className='flex flex-col md:flex-row items-center mb-4'>
            <div className='text-2xl font-bold text-center md:mr-8'>
              {firstname} {lastname}
            </div>
            {year ? (
              <div className='text-xl'>
                {year} | {major}
              </div>
            ) : (
              <div className='text-xl'>year | major</div>
            )}
          </div>
          <div className='flex flex-col md:flex-row items-center justify-between w-full'>
            <div className='flex flex-col items-center p-2'>
              <p className='text-lg font-semibold mb-1'>Roll #:</p>
              <p className='text-lg'>{roll}</p>
            </div>
            
            <div className='flex flex-col md:items-start items-center p-2'>
              <p className='text-lg font-semibold mb-1'>Email:</p>
              <p className='text-lg'>{email}</p>
            </div>
            <div className='flex flex-col md:items-start items-center p-2 md:w-48'>
              {year > 2024 && (
                <div className='flex flex-col md:items-start items-center p-2 w-full'>
                  <p className='text-lg font-semibold mb-1'>Phone Number:</p>
                  {phone ? (
                    <p className='text-lg'>{phone}</p>
                  ) : (
                    <p className='text-lg'>(xxx)-xxx-xxxx</p>
                  )}
                </div>
              )}
            </div>
            {
              linkedinUrl ?
              <a href={linkedinUrl} target='_blank' rel='noopener noreferrer' className='flex items-center p-2 md:mr-6'>
                <Image
                  src={linkdenLogo}
                  alt='linkedin'
                  className='w-14 h-14 hover:scale-105'
                />
              </a> : <div className='w-14 h-14 md:mr-6'></div>
            }
            
          </div>
        </div>
      </div>
    </div>
  )
}
