import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import supabase from '@/supabase'
import BroNavBar from '@/components/BroNavBar'
import Image from 'next/image'
import thtlogo from '../../../public/tht-logo.png'
import ReactionBar from '@/components/rush/ReactionBar'

export default function RusheeProfile () {
  const router = useRouter()
  const { uniqname } = router.query // e.g., /rushees/katemcg => uniqname = 'katemcg'

  // Logged in brother’s ID (from session)
  const [brotherID, setBrotherID] = useState('')

  // Rushee data
  const [rushee, setRushee] = useState(null)

  // Comments/feedback
  const [feedback, setFeedback] = useState([])
  const [newComment, setNewComment] = useState('')
  const [imageUrl, setImageUrl] = useState('')


  // Application questions
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState([])
  // 1. Fetch session to get current user info


  const [localEmphasis, setLocalEmphasis] = useState(likes || [])
  const isEmphasized = localEmphasis.includes(brotherID)
  const [emphasis, setEmphasis] = useState([])

  useEffect(() => {
    const getSession = async () => {
      const { data, error } = await supabase.auth.getSession()
      if (data?.session?.user?.email) {
        // Example: if your “brotherID” is the portion before '@umich.edu'
        const userEmail = data.session.user.email
        setBrotherID(userEmail.split('@')[0])
      }
    }
    getSession()
  }, [])

  // 2. Fetch rushee info (from the “Rushees” table)
  useEffect(() => {
    if (!uniqname) return

    const fetchRushee = async () => {
      const { data, error } = await supabase
        .from('Rushees')
        .select('*')
        .eq('uniqname', uniqname)
        .single()
      if (error) {
        console.error('Error fetching rushee:', error)
      } else {
        setRushee(data)
      }
    }

    fetchRushee()
  }, [uniqname])

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
  // 3. Fetch feedback/comments (from the “Application_Feedback” table)
  useEffect(() => {
    if (!uniqname) return

    const fetchFeedback = async () => {
      const { data, error } = await supabase
        .from('Application_Feedback')
        .select('*')
        .eq('rushee', uniqname)
        .order('time', { ascending: true }) // newest comment first
      if (error) {
        console.error('Error fetching feedback:', error)
      } else {
        setFeedback(data)
      }
    }

    fetchFeedback()
  }, [uniqname])



  // 3. Fetch application questions (ASC by id)
  useEffect(() => {
    const fetchQuestions = async () => {
      const { data, error } = await supabase
        .from('Application_Questions')
        .select('*')
        .order('id', { ascending: true })

      if (error) {
        console.error('Error fetching questions:', error)
      } else {
        setQuestions(data || [])
      }
    }
    fetchQuestions()
  }, [])

  useEffect(() => {
    if (!uniqname) return

    const fetchAnswers = async () => {
      const { data, error } = await supabase
        .from('Application_Answers')
        .select('*')
        .eq('uniqname', uniqname)

      if (error) {
        console.error('Error fetching answers:', error)
      } else {
        setAnswers(data || [])
      }
    }
    fetchAnswers()
  }, [uniqname])


  // 4. Adding a new comment
  const handleAddComment = async () => {
    if (!brotherID) {
      alert('You must be logged in to comment!')
      return
    }
    if (!newComment.trim()) return

    const { data, error } = await supabase
      .from('Application_Feedback')
      .insert([
        {
          rushee: uniqname,
          brother: brotherID,
          comment: newComment,
          time: new Date()
        }
      ])
      .select('*') // specifically request the newly inserted rows
      .single()
    console.log('error from insert:', error)
    console.log('data from insert:', data)

    if (error) {
      console.error('Error adding comment:', error)
    } else {
      // Prepend the newly added comment to local state
      setFeedback(prev => [data, ...prev])
      setNewComment('')
    }
  }

  // If rushee data is still loading
  if (!rushee) {
    return (
      <div className='min-h-screen'>
        <BroNavBar />
        <p className='p-4'>Loading Rushee...</p>
      </div>
    )
  }

  return (
    <div className='flex md:flex-row flex-col flex-grow border-b-2 border-[#a3000020]'>
      <BroNavBar />

      <div className='flex-1 p-4 '>


        {/* Basic rushee info */}
        <div className='flex items-center mb-4'>
          <div className='w-32 h-32 mb-3'>
            {imageUrl ? (
              <img
                className='rounded-full w-full h-full object-cover'
                src={imageUrl}
                alt={'rushee profile'}
              />
            ) : (
              <Image
                className='rounded-full w-full h-full object-cover'
                src={thtlogo}
                alt='Default logo'
              />
            )}
          </div>
          <div className = "flex flex-col w-52">
            <h2 className='text-xl font-semibold'>
              {rushee.firstname} {rushee.lastname}
            </h2>
            <p>
              {rushee.major} ({rushee.year})
            </p>
            {rushee.pronouns && <p>Pronouns: {rushee.pronouns}</p>}
            <ReactionBar
          uniqname={rushee.uniqname}
          brotherID={brotherID}
          likes={rushee.likes}
          dislikes={rushee.dislikes}
          stars={rushee.stars}
        />
          </div>
  

        </div>

        {/* If you want to also show application answers, fetch from “Application_Answers” and display them here */}
        {/* e.g. map over their answers to each question, etc. */}

        <hr className='my-4' />




        {/* APPLICATION QUESTIONS */}

        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2">Application Responses</h3>
          {questions.length === 0 ? (
            <p>No questions found.</p>
          ) : (
            <div className="space-y-4">
              {questions.map((q) => {
                // find the answer for question q.id
                const foundAns = answers.find(a => a.question_id === q.id)
                const displayAns = foundAns ? foundAns.answer : 'No answer'
                return (
                  <div key={q.id} className="border p-2 rounded">
                    <p className="font-semibold mb-1">
                      Q{q.id}: {q.question}
                    </p>
                    <p className="whitespace-pre-wrap break-words break-all">
                      {displayAns}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>


        <hr className='my-4' />
        {/* COMMENTS SECTION */}
        <div className='bg-gray-100 p-4 rounded-lg shadow-md'>
          <h3 className='text-lg font-semibold mb-2'>Comments</h3>

          {/* ADD A COMMENT */}


          {/* SHOW EXISTING COMMENTS (sorted by time descending above) */}
          {feedback.length === 0 ? (
            <p>No comments yet. Be the first!</p>
          ) : (
            <div className='space-y-4'>
              {feedback.map(fb => (
                <div key={fb.id} className='border-b pb-2'>
                  <p className='font-bold'>
                    {fb.brother} –{' '}
                    <span className='text-sm text-gray-500'>
                      {new Date(fb.time).toLocaleString()}
                    </span>
                  </p>
                  <div className='max-w-full overflow-hidden'>
                    <p className='whitespace-pre-wrap break-words break-all'>
                      {fb.comment}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
                    <div className='mb-4'>
            <textarea
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              className='w-full p-2 rounded border'
              placeholder='Write a comment...'
              rows={3}
            />
            <button
              onClick={handleAddComment}
              className='bg-[#8B0000] text-white px-4 py-2 mt-2 rounded hover:bg-red-800'
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
