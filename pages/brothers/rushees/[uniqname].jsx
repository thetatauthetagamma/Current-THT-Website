import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import supabase from '@/supabase'
import BroNavBar from '@/components/BroNavBar'
import Image from 'next/image'
import thtlogo from '../../../public/tht-logo.png'
import ReactionBar from '@/components/rush/ReactionBar'
import { FaExclamation } from 'react-icons/fa'

export default function RusheeProfile () {
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

  // For per-comment reply text
  const [replyTexts, setReplyTexts] = useState({})
  // Whether each parent comment's replies are expanded
  const [expandedReplies, setExpandedReplies] = useState({})
  // Whether each parent comment's reply box is shown
  const [showReplyBox, setShowReplyBox] = useState({})

  const [imageUrl, setImageUrl] = useState('')

  // We'll store a dictionary: { [uniqname]: "Firstname Lastname" }
  const [brothersMap, setBrothersMap] = useState({})

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
  // 2) Fetch all Brothers once -> build { uniqname: "First Last" } map
  // ─────────────────────────────────────────────────────────
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
        console.log('Fetched all brothers:', data)
        const map = {}
        data.forEach(bro => {
          map[bro.userid] = `${bro.firstname} ${bro.lastname}`
        })
        setBrothersMap(map)
        console.log('Fetched brothers map:', map)
      }
    }
    fetchAllBrothers()
  }, [])

  // ─────────────────────────────────────────────────────────
  // 3) Fetch rushee
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
  // 4) Fetch rushee image
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
    console.log("Fidget Fam == Best Fam")
  }, [uniqname])

  // ─────────────────────────────────────────────────────────
  // 5) Fetch comments (Application_Feedback)
  //    Also fetch the brother's firstname + lastname from Brothers
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!uniqname) return
    const fetchFeedback = async () => {
      const { data, error } = await supabase
        .from('Application_Feedback')
        .select(
          `
          *,
          brotherDetails:Brothers(
            firstname,
            lastname
          )
        `
        )
        .eq('rushee', uniqname)
        .order('time', { ascending: true })
      if (!error && data) {
        setFeedback(data)
      }
    }
    fetchFeedback()
  }, [uniqname])

  // ─────────────────────────────────────────────────────────
  // 6) Fetch Q&A
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
  // 7) Add top-level comment
  // ─────────────────────────────────────────────────────────
  async function handleAddComment () {
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
      .select(
        `
        *,
        brotherDetails:Brothers(
          firstname,
          lastname
        )
      `
      )
      .single()

    if (error) {
      console.error('Error adding comment:', error)
    } else if (data) {
      setFeedback(prev => [...prev, data])
      setNewComment('')
    }
  }

  // ─────────────────────────────────────────────────────────
  // 8) Add REPLY
  // ─────────────────────────────────────────────────────────
  async function handleAddReply (parentId) {
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
      .select(
        `
        *,
        brotherDetails:Brothers(
          firstname,
          lastname
        )
      `
      )
      .single()

    if (error) {
      console.error('Error adding reply:', error)
    } else if (data) {
      setFeedback(prev => [...prev, data])
      setReplyTexts(prev => ({ ...prev, [parentId]: '' }))
      // Optionally auto-expand the replies
      setExpandedReplies(prev => ({ ...prev, [parentId]: true }))
      showReplyBox[parentId] = false
    }
  }

  // ─────────────────────────────────────────────────────────
  // 9) Toggle emphasis
  // ─────────────────────────────────────────────────────────
  async function handleToggleEmphasis (commentId) {
    const comment = feedback.find(f => f.id === commentId)
    if (!comment) return

    // Disallow self-emphasis
    if (comment.brother === brotherID) {
      // Optionally show alert or do nothing
      return
    }

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
      .select(
        `
        *,
        brotherDetails:Brothers(
          firstname,
          lastname
        )
      `
      )
      .single()

    if (error) {
      console.error('Error toggling emphasis:', error)
      return
    }
    if (data) {
      // Replace the entire updated comment in local state
      setFeedback(prev => prev.map(f => (f.id === commentId ? data : f)))
    }
  }

  // ─────────────────────────────────────────────────────────
  // 10) Sorting comments
  // ─────────────────────────────────────────────────────────
  const topLevelComments = feedback.filter(f => !f.parent_id)

  function getRepliesFor (commentId) {
    return feedback
      .filter(f => f.parent_id === commentId)
      .sort((a, b) => new Date(a.time) - new Date(b.time))
  }

  // Expand/collapse replies
  function handleToggleExpand (parentId) {
    setExpandedReplies(prev => ({
      ...prev,
      [parentId]: !prev[parentId]
    }))
  }

  // Show/hide reply box
  function handleToggleReplyBox (parentId) {
    setShowReplyBox(prev => ({
      ...prev,
      [parentId]: !prev[parentId]
    }))
  }

  // ─────────────────────────────────────────────────────────
  // Rendering
  // ─────────────────────────────────────────────────────────
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
          <div className='w-32 h-32 mb-3 mx-4'>
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

        {/* COMMENTS (top-level + replies) */}
        <div className='p-4 rounded-lg shadow-md bg-white'>
          <h3 className='text-lg font-semibold mb-2'>Comments</h3>

          {topLevelComments.length === 0 ? (
            <p className='text-gray-500'>No comments yet. Be the first!</p>
          ) : (
            <div className='space-y-6'>
              {topLevelComments.map(parent => {
                const childReplies = getRepliesFor(parent.id)
                const isEmphasized = parent.emphasis?.includes(brotherID)
                const emphasisCount = parent.emphasis?.length || 0

                // Grab the first+last name from the joined data
                const brotherFirst = parent.brotherDetails?.firstname
                const brotherLast = parent.brotherDetails?.lastname

                // Map emphasis => "Firstname Lastname"
                const emphasizedByNames = (parent.emphasis || []).map(uniq => {
                  return brothersMap[uniq] || uniq
                })

                // Whether user can click (disallow if own comment)
                const canClickEmphasis = parent.brother !== brotherID

                return (
                  <div key={parent.id} className='flex flex-col space-y-1'>
                    {/* Single comment container */}
                    <div className='flex items-start justify-between'>
                      <div>
                        {/* If we have brotherDetails, show that; otherwise, fallback to parent.brother */}
                        <p className='font-bold text-sm'>
                          {brotherFirst && brotherLast
                            ? `${brotherFirst} ${brotherLast}`
                            : parent.brother}{' '}
                          <span className='text-xs text-gray-400 ml-2'>
                            {new Date(parent.time).toLocaleString()}
                          </span>
                        </p>
                        <p className='text-sm text-gray-800 mb-1'>
                          {parent.comment}
                        </p>
                      </div>

                      {/* Emphasis with a custom tooltip (no default browser delay) */}
                      <div
                        // NEW: group + relative for the hover-based custom tooltip
                        className={`relative group flex items-center space-x-1 ${
                          canClickEmphasis
                            ? 'cursor-pointer'
                            : 'cursor-not-allowed'
                        }`}
                        onClick={() => {
                          if (!canClickEmphasis) return
                          handleToggleEmphasis(parent.id)
                        }}
                      >
                        {/* The Exclamation icons */}
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

                        {/* Custom tooltip displayed on hover */}
                        <div
                          className='absolute hidden group-hover:block bg-gray-800 text-white text-xs px-2 py-1 rounded
             whitespace-nowrap top-1/2 -translate-y-1/2 right-full mr-2'
                        >
                          {emphasizedByNames.length > 0 ? (
                            <div>
                              <p className='font-semibold mb-1'>
                                Emphasized by:
                              </p>
                              {emphasizedByNames.map((name, i) => (
                                <p key={i}>{name}</p>
                              ))}
                            </div>
                          ) : (
                            'No emphasis yet'
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Buttons: "Reply" / "View replies" */}
                    <div className='ml-0 flex items-center space-x-2 pl-2 text-sm '>
                      {/* If there are children, show "View replies" or "Hide Replies" */}
                      {childReplies.length > 0 && (
                        <button
                          onClick={() => handleToggleExpand(parent.id)}
                          className='text-gray-500 underline'
                        >
                          {expandedReplies[parent.id]
                            ? `Hide Replies`
                            : `View replies (${childReplies.length})`}
                        </button>
                      )}
                      {/* Always show "Reply" button */}
                      <button
                        onClick={() => handleToggleReplyBox(parent.id)}
                        className='text-gray-500 underline'
                      >
                        {showReplyBox[parent.id] ? 'Cancel Reply' : 'Reply'}
                      </button>
                    </div>

                    {/* If expanded, show child replies */}
                    {expandedReplies[parent.id] && (
                      <div className='pl-4 border-l border-gray-300 space-y-4 mt-1'>
                        {childReplies.map(child => {
                          const childEmphasized =
                            child.emphasis?.includes(brotherID)
                          const childEmphasisCount = child.emphasis?.length || 0

                          const childFirst = child.brotherDetails?.firstname
                          const childLast = child.brotherDetails?.lastname

                          const childEmphasizedByNames = (
                            child.emphasis || []
                          ).map(uniq => {
                            return brothersMap[uniq] || uniq
                          })
                          console.log(
                            'childEmphasizedByNames:',
                            childEmphasizedByNames
                          )

                          const canClickChild = child.brother !== brotherID

                          return (
                            <div
                              key={child.id}
                              className='flex items-start justify-between'
                            >
                              <div>
                                <p className='font-bold text-sm'>
                                  {childFirst && childLast
                                    ? `${childFirst} ${childLast}`
                                    : child.brother}{' '}
                                  <span className='text-xs text-gray-400 ml-2'>
                                    {new Date(child.time).toLocaleString()}
                                  </span>
                                </p>
                                <p className='text-sm text-gray-800 mb-1'>
                                  {child.comment}
                                </p>
                              </div>

                              {/* Child emphasis with custom tooltip */}
                              <div
                                className={`relative group flex items-center space-x-1 ${
                                  canClickChild
                                    ? 'cursor-pointer'
                                    : 'cursor-not-allowed'
                                }`}
                                onClick={() => {
                                  if (!canClickChild) return
                                  handleToggleEmphasis(child.id)
                                }}
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

                                {/* Child tooltip */}
                                <div
                                  className='absolute hidden group-hover:block bg-gray-800 text-white text-xs px-2 py-1 rounded
             whitespace-nowrap top-1/2 -translate-y-1/2 right-full mr-2'
                                >
                                  {childEmphasizedByNames.length > 0 ? (
                                    <div>
                                      <p className='font-semibold mb-1'>
                                        Emphasized by:
                                      </p>
                                      {childEmphasizedByNames.map((name, i) => (
                                        <p key={i}>{name}</p>
                                      ))}
                                    </div>
                                  ) : (
                                    'No emphasis yet'
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* If showReplyBox is true, show the reply text area */}
                    {showReplyBox[parent.id] && (
                      <div className='ml-6 mt-2'>
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
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
          {/* Input for top-level comment */}
          <div className='mt-4'>
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
        </div>
      </div>
    </div>
  )
}
