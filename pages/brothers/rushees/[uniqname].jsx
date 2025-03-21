import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import supabase from '@/supabase'
import BroNavBar from '@/components/BroNavBar'
import Image from 'next/image'
import thtlogo from '../../../public/tht-logo.png'
import ReactionBar from '@/components/rush/ReactionBar'

// React Icons
import { FaExclamation } from 'react-icons/fa'

export default function RusheeProfile() {
  const router = useRouter()
  const { uniqname } = router.query
  const [brotherID, setBrotherID] = useState('')
  const [rushee, setRushee] = useState(null)

  // Q&A
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState([])

  // Comments
  const [feedback, setFeedback] = useState([])
  const [newComment, setNewComment] = useState('')
  const [replyTexts, setReplyTexts] = useState({})

  // "Expanded" state for replies: expandedReplies[commentId] = bool
  const [expandedReplies, setExpandedReplies] = useState({})

  const [imageUrl, setImageUrl] = useState('')

  // ─────────────────────────────────────────────────────────
  // 1) Auth session -> get brotherID
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession()
      if (data?.session?.user?.email) {
        setBrotherID(data.session.user.email.split('@')[0])
      }
    }
    getSession()
  }, [])

  // ─────────────────────────────────────────────────────────
  // 2) Fetch rushee
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!uniqname) return
    const fetchRushee = async () => {
      const { data, error } = await supabase
        .from('Rushees')
        .select('*')
        .eq('uniqname', uniqname)
        .single()
      if (!error && data) {
        setRushee(data)
      }
    }
    fetchRushee()
  }, [uniqname])

  // ─────────────────────────────────────────────────────────
  // 3) Fetch rushee image
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!uniqname) return
    const fetchRusheeImage = async () => {
      const { data: ImageData, error } = await supabase.storage
        .from('rushees')
        .download(`${uniqname}.jpeg`)
      if (!error && ImageData) {
        setImageUrl(URL.createObjectURL(ImageData))
      }
    }
    fetchRusheeImage()
  }, [uniqname])

  // ─────────────────────────────────────────────────────────
  // 4) Fetch comments (Application_Feedback)
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!uniqname) return
    const fetchFeedback = async () => {
      const { data, error } = await supabase
        .from('Application_Feedback')
        .select('*')
        .eq('rushee', uniqname)
        .order('time', { ascending: true })
      if (!error && data) {
        setFeedback(data)
      }
    }
    fetchFeedback()
  }, [uniqname])

  // ─────────────────────────────────────────────────────────
  // 5) Fetch Q&A
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchQuestions = async () => {
      const { data, error } = await supabase
        .from('Application_Questions')
        .select('*')
        .order('id', { ascending: true })
      if (!error && data) setQuestions(data)
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
      if (!error && data) {
        setAnswers(data)
      }
    }
    fetchAnswers()
  }, [uniqname])

  // ─────────────────────────────────────────────────────────
  // Add top-level comment
  // ─────────────────────────────────────────────────────────
  async function handleAddComment() {
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
          time: new Date(),
          parent_id: null,
          emphasis: []
        }
      ])
      .select('*')
      .single()

    if (error) {
      console.error('Error adding comment:', error)
    } else if (data) {
      setFeedback(prev => [...prev, data])
      setNewComment('')
    }
  }

  // ─────────────────────────────────────────────────────────
  // Add REPLY
  // ─────────────────────────────────────────────────────────
  async function handleAddReply(parentId) {
    if (!brotherID) {
      alert('You must be logged in!')
      return
    }
    const text = replyTexts[parentId] || ''
    if (!text.trim()) return

    const { data, error } = await supabase
      .from('Application_Feedback')
      .insert([
        {
          rushee: uniqname,
          brother: brotherID,
          comment: text,
          time: new Date(),
          parent_id: parentId,
          emphasis: []
        }
      ])
      .select('*')
      .single()
    
    if (error) {
      console.error('Error adding reply:', error)
    } else if (data) {
      setFeedback(prev => [...prev, data])
      setReplyTexts(prev => ({ ...prev, [parentId]: '' }))
    }
  }

  // ─────────────────────────────────────────────────────────
  // Toggle emphasis
  // ─────────────────────────────────────────────────────────
  async function handleToggleEmphasis(commentId) {
    const comment = feedback.find(f => f.id === commentId)
    if (!comment) return
    const oldEmphasis = comment.emphasis || []
    let newEmphasis
    if (oldEmphasis.includes(brotherID)) {
      newEmphasis = oldEmphasis.filter(u => u !== brotherID)
    } else {
      newEmphasis = [...oldEmphasis, brotherID]
    }

    const { data, error } = await supabase
      .from('Application_Feedback')
      .update({ emphasis: newEmphasis })
      .eq('id', commentId)
      .select()
      .single()
    if (error) {
      console.error('Error toggling emphasis:', error)
      return
    }
    setFeedback(prev =>
      prev.map(f => {
        if (f.id === commentId) return { ...f, emphasis: newEmphasis }
        return f
      })
    )
  }

  // ─────────────────────────────────────────────────────────
  // Sorting comments
  // ─────────────────────────────────────────────────────────
  const topLevelComments = feedback.filter(f => !f.parent_id)

  function getRepliesFor(commentId) {
    return feedback
      .filter(f => f.parent_id === commentId)
      .sort((a, b) => new Date(a.time) - new Date(b.time))
  }

  // Toggle expand
  function handleToggleExpand(parentId) {
    setExpandedReplies(prev => ({
      ...prev,
      [parentId]: !prev[parentId]
    }))
  }

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

      <div className='flex-1 p-4'>
        {/* Basic rushee info */}
        <div className='flex items-center mb-4'>
          <div className='w-32 h-32 mb-3'>
            {imageUrl ? (
              <img
                className='rounded-full w-full h-full object-cover'
                src={imageUrl}
                alt='rushee profile'
              />
            ) : (
              <Image
                className='rounded-full w-full h-full object-cover'
                src={thtlogo}
                alt='Default logo'
              />
            )}
          </div>
          <div className='flex flex-col w-52'>
            <h2 className='text-xl font-semibold'>
              {rushee.firstname} {rushee.lastname}
            </h2>
            <p>
              {rushee.major} ({rushee.year})
            </p>
            {rushee.pronouns && <p>Pronouns: {rushee.pronouns}</p>}

            {/* ReactionBar for the rushee profile */}
            <ReactionBar
              uniqname={rushee.uniqname}
              brotherID={brotherID}
              likes={rushee.likes}
              dislikes={rushee.dislikes}
              stars={rushee.stars}
            />
          </div>
        </div>

        <hr className='my-4' />

        {/* APPLICATION RESPONSES */}
        <div className='mb-6'>
          <h3 className='text-xl font-semibold mb-2'>Application Responses</h3>
          {questions.length === 0 ? (
            <p>No questions found.</p>
          ) : (
            <div className='space-y-4'>
              {questions.map(q => {
                const foundAns = answers.find(a => a.question_id === q.id)
                const displayAns = foundAns ? foundAns.answer : 'No answer'
                return (
                  <div key={q.id} className='border p-2 rounded'>
                    <p className='font-semibold mb-1'>
                      Q{q.id}: {q.question}
                    </p>
                    <p className='whitespace-pre-wrap break-words break-all'>
                      {displayAns}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <hr className='my-4' />

        {/* COMMENTS (top-level + replies, Instagram style) */}
        <div className='p-4 rounded-lg shadow-md bg-white'>
          <h3 className='text-lg font-semibold mb-2'>Comments</h3>

          {/* Input for top-level comment */}
          <div className='mb-4'>
            <textarea
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              className='w-full p-2 rounded border'
              placeholder='Write a top-level comment...'
              rows={2}
            />
            <button
              onClick={handleAddComment}
              className='bg-[#8B0000] text-white px-4 py-2 mt-2 rounded hover:bg-red-800'
            >
              Submit
            </button>
          </div>

          {topLevelComments.length === 0 ? (
            <p className="text-gray-500">No comments yet. Be the first!</p>
          ) : (
            <div className='space-y-6'>
              {topLevelComments.map(parent => {
                const childReplies = getRepliesFor(parent.id)
                const isEmphasized = parent.emphasis?.includes(brotherID)
                const emphasisCount = parent.emphasis?.length || 0

                return (
                  <div key={parent.id} className='flex flex-col space-y-1'>
                    {/* Single comment container (like Instagram) */}
                    <div className='flex items-start justify-between'>
                      <div>
                        <p className='font-bold text-sm'>
                          {parent.brother}{' '}
                          <span className='text-xs text-gray-400 ml-2'>
                            {new Date(parent.time).toLocaleString()}
                          </span>
                        </p>
                        <p className='text-sm text-gray-800 mb-1'>
                          {parent.comment}
                        </p>
                      </div>
                      {/* Emphasis icon on the right */}
                      <div
                        className='flex items-center space-x-1 cursor-pointer'
                        onClick={() => handleToggleEmphasis(parent.id)}
                        // "title" attribute for a simple tooltip
                        title={
                          emphasisCount > 0
                            ? `Emphasized by: ${parent.emphasis.join(', ')}`
                            : 'No emphasis yet'
                        }
                      >
                        {/* Two FaExclamation icons side by side for "!!" */}
                        {isEmphasized ? (
                          <div className='flex items-center space-x-0 text-[#8B0000] text-2xl'>
                            <FaExclamation className='mr-[-8px]' />
                            <FaExclamation />
                          </div>
                        ) : (
                          <div className='flex items-center text-[#8B0000] text-2xl opacity-40 space-x-0'>
                            <FaExclamation className='mr-[-8px]' />
                            <FaExclamation />
                          </div>
                        )}
                        <span className='text-sm font-semibold text-gray-700'>
                          {emphasisCount}
                        </span>
                      </div>
                    </div>

                    {/* "View replies" if we have child replies and not expanded */}
                    {childReplies.length > 0 && !expandedReplies[parent.id] && (
                      <button
                        onClick={() => handleToggleExpand(parent.id)}
                        className='ml-0 text-gray-500 text-sm pl-2 underline w-fit'
                      >
                        View replies ({childReplies.length})
                      </button>
                    )}
                    {/* If expanded, show the child replies */}
                    {expandedReplies[parent.id] && (
                      <div className='pl-4 border-l border-gray-300 space-y-4 mt-1'>
                        {childReplies.map(child => {
                          const childEmphasized = child.emphasis?.includes(brotherID)
                          const childEmphasisCount = child.emphasis?.length || 0
                          return (
                            <div key={child.id} className='flex items-start justify-between'>
                              <div>
                                <p className='font-bold text-sm'>
                                  {child.brother}{' '}
                                  <span className='text-xs text-gray-400 ml-2'>
                                    {new Date(child.time).toLocaleString()}
                                  </span>
                                </p>
                                <p className='text-sm text-gray-800 mb-1'>{child.comment}</p>
                              </div>
                              {/* Child emphasis on the right */}
                              <div
                                className='flex items-center space-x-1 cursor-pointer'
                                onClick={() => handleToggleEmphasis(child.id)}
                                title={
                                  childEmphasisCount > 0
                                    ? `Emphasized by: ${child.emphasis.join(', ')}`
                                    : 'No emphasis yet'
                                }
                              >
                                {childEmphasized ? (
                                  <div className='flex items-center space-x-0 text-[#8B0000] text-2xl'>
                                    <FaExclamation className='mr-[-8px]' />
                                    <FaExclamation />
                                  </div>
                                ) : (
                                  <div className='flex items-center text-[#8B0000] text-2xl opacity-40 space-x-0'>
                                    <FaExclamation className='mr-[-8px]' />
                                    <FaExclamation />
                                  </div>
                                )}
                                <span className='text-sm font-semibold text-gray-700'>
                                  {childEmphasisCount}
                                </span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* If expanded or no children, show a "reply" area always */}
                    <div className='mt-2 pl-4'>
                      <textarea
                        value={replyTexts[parent.id] || ''}
                        onChange={e =>
                          setReplyTexts(prev => ({
                            ...prev,
                            [parent.id]: e.target.value
                          }))
                        }
                        rows={1}
                        className='border w-full p-1 rounded text-sm'
                        placeholder='Write a reply...'
                      />
                      <button
                        onClick={() => handleAddReply(parent.id)}
                        className='bg-green-600 text-white px-3 py-1 mt-1 rounded text-sm'
                      >
                        Submit Reply
                      </button>
                      {childReplies.length > 0 && expandedReplies[parent.id] && (
                        <button
                          onClick={() => handleToggleExpand(parent.id)}
                          className='ml-3 bg-gray-300 text-black px-3 py-1 mt-1 rounded text-sm'
                        >
                          Hide Replies
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
