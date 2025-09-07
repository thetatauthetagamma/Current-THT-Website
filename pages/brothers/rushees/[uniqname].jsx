/**
 * RusheeProfile Component
 * 
 * This component displays a detailed profile page for a rushee, including:
 * - Basic rushee information and profile photo
 * - Application responses to questions
 * - Comment system with replies and emphasis features
 * - Diversity and Coffee Chat feedback forms with ratings
 * - Anonymous commenting system for brothers
 */
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import supabase from '@/supabase'
import BroNavBar from '@/components/BroNavBar'
import Image from 'next/image'
import thtlogo from '../../../public/tht-logo.png'
import ReactionBar from '@/components/rush/ReactionBar'
import RusheeAttendance from '@/components/rush/RusheeAttendance'
import { FaExclamation, FaArrowLeft } from 'react-icons/fa'
import { BrothersProvider } from '@/contexts/BrothersContext'


const RusheeStatus = Object.freeze({
  STRONG_YES: 'Strong Bid',
  WEAK_YES: 'Weak Bid',
  NEUTRAL: 'Neutral',
  WEAK_NO: 'Weak No Bid',
  STRONG_NO: 'Strong No Bid'
})

const textOf = (row) => {
  const v = row?.value;

  // jsonb object like { text: "..." }
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    // Defensive: ensure it's a string
    return typeof v.text === 'string' ? v.text : JSON.stringify(v.text ?? '');
  }

  if (typeof v === 'string') return v;

  // Fallback: convert any other value to string
  return String(v ?? '');
};


export default function RusheeProfile() {
  const router = useRouter()
  const { uniqname } = router.query
  const [brotherID, setBrotherID] = useState('')
  const [rushee, setRushee] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)

  // Q&A
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState([])

  // Comments
  const [feedback, setFeedback] = useState([])
  const [newComment, setNewComment] = useState('')

  // Coffee Chats
  const [coffeeChatFeedback, setCoffeeChatFeedback] = useState('')
  const [diversityChatFeedback, setDiversityChatFeedback] = useState('')

  const [coffeeChatRating, setCoffeeChatRating] = useState(RusheeStatus.NEUTRAL)
  const [diversityChatRating, setDiversityChatRating] = useState(RusheeStatus.NEUTRAL)

  const [editingCommentId, setEditingCommentId] = useState(null)
  const [editTexts, setEditTexts] = useState({})

  // ─────────────────────────────────────────────────────────
  // Back button functionality
  // ─────────────────────────────────────────────────────────
  const handleBackToRushbook = () => {
    router.push('/brothers/rushbook')
  }
  // Edit comment functionality
  // ─────────────────────────────────────────────────────────
  const handleEditComment = (commentId, currentText) => {
    // Only allow editing if you're the comment author
    const comment = feedback.find(f => f.id === commentId);
    if (comment && comment.brother !== brotherID) {
      alert('You can only edit your own comments!');
      return;
    }

    // Set the comment we're editing
    setEditingCommentId(commentId);
    // Pre-populate the edit text with the current comment text
    setEditTexts(prev => ({
      ...prev,
      [commentId]: currentText
    }));
  };

  // Function to save the edited comment
  const handleSaveEdit = async (commentId) => {
    const newText = editTexts[commentId]?.trim();

    if (!newText) return; // Don't save empty comments

    const { data, error } = await supabase
      .from('Application_Feedback')
      .update({ value: { text: newText } })
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
      .single();

    if (error) {
      console.error('Error updating comment:', error);
      return;
    }

    if (data) {
      // Update the comment in local state
      setFeedback(prev => prev.map(f => (f.id === commentId ? data : f)));
      // Exit edit mode
      setEditingCommentId(null);
    }
  };

  // Function to cancel editing
  const handleCancelEdit = () => {
    setEditingCommentId(null);
  };
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
  // 1.5) Check if user is admin
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchAdminRole = async () => {
      if (!brotherID) return
      const { data, error } = await supabase
        .from('Brothers')
        .select('adminrole')
        .eq('userid', brotherID)
        .single()

      if (!error && data) {
        setIsAdmin(data.adminrole === 'dev' || data.adminrole === 'rush')
      } else {
        console.error('Error fetching admin role:', error)
      }
    }
    fetchAdminRole()
  }, [brotherID])

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
    console.log("Qam Fam == Best Fam")
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
        .eq('value_type', 'comment')
        .order('time', { ascending: true })
      if (!error && data) {
        setFeedback(data)
      }
    }
    fetchFeedback()
  }, [uniqname])

  // ─────────────────────────────────────────────────────────
  // 6a) Fetch Q&A
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
  // 6b) Fetch feedback
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!uniqname) {
      return
    }
    const fetchChatFeedback = async () => {
      const { data, error } = await supabase
        .from('Application_Feedback')
        .select('value, value_type')
        .eq('rushee', uniqname)
        .in('value_type', ['diversity_chat_feedback', 'coffee_chat_feedback'])
        .order('time', { ascending: false });
      if (data && !error) {
        const diversity = data.find(f => f.value_type === 'diversity_chat_feedback');
        const coffee = data.find(f => f.value_type === 'coffee_chat_feedback');
        if (diversity?.value?.text) {
          setDiversityChatFeedback(diversity.value.text);
        }
        if (coffee?.value?.text) {
          setCoffeeChatFeedback(coffee.value.text);
        }
      }
    }

    fetchChatFeedback()
  }, [uniqname])


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
  // 6c) Populate Old ratings
  //  ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!uniqname || !brotherID) return;

    const fetchOldRatings = async () => {
      const [{ data: divRows, error: divErr }, { data: cofRows, error: cofErr }] = await Promise.all([
        supabase
          .from('Application_Feedback')
          .select('value, time')
          .eq('rushee', uniqname)
          .eq('brother', brotherID)
          .eq('value_type', 'diversity_chat_decision')
          .order('time', { ascending: false })
          .limit(1),
        supabase
          .from('Application_Feedback')
          .select('value, time')
          .eq('rushee', uniqname)
          .eq('brother', brotherID)
          .eq('value_type', 'coffee_chat_decision')
          .order('time', { ascending: false })
          .limit(1),
      ]);

      if (!divErr && divRows?.length) {
        const r = divRows[0]?.value?.rating;
        if (r && Object.values(RusheeStatus).includes(r)) setDiversityChatRating(r);
      }
      if (!cofErr && cofRows?.length) {
        const r = cofRows[0]?.value?.rating;
        if (r && Object.values(RusheeStatus).includes(r)) setCoffeeChatRating(r);
      }
    };

    fetchOldRatings();
  }, [uniqname, brotherID]);



  // ─────────────────────────────────────────────────────────
  // 7) Add top-level comment
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
          value_type: 'comment',
          value: { text: newComment },
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
          value: { text },
          value_type: 'comment',
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
      setShowReplyBox(prev => ({ ...prev, [parentId]: false }))
    }
  }

  // ─────────────────────────────────────────────────────────
  // 9) Toggle emphasis
  // ─────────────────────────────────────────────────────────
  async function handleToggleEmphasis(commentId) {
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

  function getRepliesFor(commentId) {
    return feedback
      .filter(f => f.parent_id === commentId)
      .sort((a, b) => new Date(a.time) - new Date(b.time))
  }

  // Expand/collapse replies
  function handleToggleExpand(parentId) {
    setExpandedReplies(prev => ({
      ...prev,
      [parentId]: !prev[parentId]
    }))
  }

  // Show/hide reply box
  function handleToggleReplyBox(parentId) {
    setShowReplyBox(prev => ({
      ...prev,
      [parentId]: !prev[parentId]
    }))
  }


  // ─────────────────────────────────────────────────────────
  // Add Feedback
  // ─────────────────────────────────────────────────────────
  async function handleAddFeedback(text, type_name, field) {
    if (!brotherID) {
      alert('You must be logged in!');
      return;
    }
    const { data: existing, error: fetchError } = await supabase
      .from('Application_Feedback')
      .select('id')
      .eq('rushee', uniqname)
      .eq('value_type', type_name)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // Ignore "no rows" error
      console.error('Error fetching existing feedback:', fetchError);
      return;
    }

    let result;

    if (existing) {
      // Update existing feedback
      const { data, error } = await supabase
        .from('Application_Feedback')
        .update({ value: { text } })
        .eq('id', existing.id)
        .select(`
          *,
          brotherDetails:Brothers(
            firstname,
            lastname
          )
        `)
        .single();

      if (error) {
        console.error('Error updating feedback:', error);
        return;
      }

      result = data;
    } else {
      // Insert new feedback
      const { data, error } = await supabase
        .from('Application_Feedback')
        .insert([
          {
            rushee: uniqname,
            brother: brotherID,
            value: { text },
            value_type: type_name,
            time: new Date(),
            parent_id: null,
            emphasis: []
          }
        ])
        .select(`
      *,
      brotherDetails:Brothers(
        firstname,
        lastname
      )
    `)
        .single();

      if (error) {
        console.error('Error adding feedback:', error);
        return;
      }

      // Always update the main feedback list
      if (data.value_type === 'comment') {
        setFeedback(prev => [...prev, data]);
      }

      // Reset the correct text state based on the field flag
      if (field === 'diversity') {
        setDiversityChatFeedback(text);
      } else if (field === 'coffee') {
        setCoffeeChatFeedback(text);
      }
    }
  }

  // ─────────────────────────────────────────────────────────
  // Add Rating
  // ─────────────────────────────────────────────────────────
  async function handleAddRating(rating, type_name) {
    if (!brotherID) {
      alert('You must be logged in!');
      return;
    }

    const { data: existing, error: fetchError } = await supabase
      .from('Application_Feedback')
      .select('*')
      .eq('rushee', uniqname)
      .eq('value_type', type_name)
      .single();
    if (fetchError && fetchError.code !== "PGRST116") {
      console.error('Error fetching existing rating:', fetchError);
      return;
    }
    console.log(existing)

    if (existing) {
      // Update existing rating
      const { data, error } = await supabase
        .from('Application_Feedback')
        .update({ value: { rating } })
        .eq('id', existing.id)
        .select(`
          *,
          brotherDetails:Brothers(
            firstname,
            lastname
          )
        `)
        .single();

      if (error) {
        console.error('Error updating rating:', error);
        return;
      }

      // Update local state
      setFeedback(prev => {
        const index = prev.findIndex(f => f.id === existing.id);
        if (index !== -1) {
          const updated = { ...prev[index], ...data };
          return [...prev.slice(0, index), updated, ...prev.slice(index + 1)];
        }
        return prev;
      });
    } else {
      // Insert new rating
      const { data, error } = await supabase
        .from('Application_Feedback')
        .insert([
          {
            rushee: uniqname,
            brother: brotherID,
            value: { rating },
            value_type: type_name,
            time: new Date(),
            parent_id: null,
            emphasis: []
          }
        ])
        .select(`
          *,
          brotherDetails:Brothers(
            firstname,
            lastname
          )
        `)
        .single();

      if (error) {
        console.error('Error adding rating:', error);
        return;
      }

      // Always update the main feedback list
      if (['comment', 'diversity_chat_decision', 'coffee_chat_decision'].includes(data.value_type)) {
        setFeedback(prev => [...prev, data]);
      }
    }
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
    <BrothersProvider>
      <div className='flex md:flex-row flex-col flex-grow border-b-2 border-[#a3000020]'>
        <BroNavBar />

        <div className='flex-1 p-4'>
          {/* Back button */}
          <button
            onClick={handleBackToRushbook}
            className='flex items-center gap-2 mb-4 px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors'
          >
            <FaArrowLeft className='w-4 h-4' />
            Back to Rush Book
          </button>

          {/* Basic rushee info */}
          <div className='flex flex-col lg:flex-row lg:items-center mb-4 gap-4'>
            <div className='flex flex-col sm:flex-row items-center sm:items-start gap-4'>
              <div className='w-32 h-32 flex-shrink-0'>
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
              <div className='flex flex-col text-center sm:text-left'>
                <h2 className='text-xl font-semibold'>
                  {rushee.firstname} {rushee.lastname}
                </h2>
                <p>
                  {rushee.major} ({rushee.year})
                </p>
                {rushee.pronouns && <p>Pronouns: {rushee.pronouns}</p>}

                {/* ─────────────────────────────────────────────────────────────────────── */}
                <div className='mt-2'>
                  <ReactionBar
                    uniqname={rushee.uniqname}
                    brotherID={brotherID}
                    likes={rushee.likes}
                    dislikes={rushee.dislikes}
                    stars={rushee.stars}
                    isAdmin={isAdmin}
                  />
                </div>
              </div>
            </div>
            {/* Attendance display */}
            <div className='w-full lg:flex-1'>
              <div className='mb-2 text-sm font-semibold'>Event Attendance:</div>
              <div className='bg-gray-50 p-3 rounded-md border border-gray-200 overflow-x-auto'>
                <RusheeAttendance uniqname={rushee.uniqname} />
              </div>
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
                          {/* Show only timestamp, no name */}
                          <p className='font-bold text-sm'>
                            Anonymous{' '}
                            <span className='text-xs text-gray-400 ml-2'>
                              {new Date(parent.time).toLocaleString()}
                            </span>
                          </p>
                          <p className='text-sm text-gray-800 mb-1'>
                            {textOf(parent)}
                          </p>
                        </div>

                        {/* Emphasis with a custom tooltip (no default browser delay) */}
                        <div
                          // NEW: group + relative for the hover-based custom tooltip
                          className={`relative group flex items-center space-x-1 ${canClickEmphasis
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
                                  Emphasized by {emphasizedByNames.length} users
                                </p>
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
                        {/* Edit button - only show for user's own comments */}
                        {parent.brother === brotherID && (
                          <button
                            onClick={() => handleEditComment(parent.id, textOf(parent))}
                            className='text-gray-500 underline'
                          >
                            Edit
                          </button>
                        )}
                        {/* If currently editing this comment, show save/cancel buttons */}
                        {editingCommentId === parent.id ? (
                          <div className='flex space-x-2'>
                            <textarea
                              value={editTexts[parent.id] || ''}
                              onChange={(e) => setEditTexts(prev => ({
                                ...prev,
                                [parent.id]: e.target.value
                              }))}
                              className='border rounded p-1 text-sm w-full'
                            />
                            <button
                              onClick={() => handleSaveEdit(parent.id)}
                              className='bg-green-600 text-white px-2 py-1 rounded text-xs'
                            >
                              Save
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className='bg-gray-500 text-white px-2 py-1 rounded text-xs'
                            >
                              Cancel
                            </button>
                          </div>
                        ) : null}
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
                              <div key={child.id} className='flex flex-col'>
                                {/* top row (author/time/text + emphasis) */}
                                <div className='flex items-start justify-between'>
                                  <div>
                                    <p className='font-bold text-sm'>
                                      Anonymous{' '}
                                      <span className='text-xs text-gray-400 ml-2'>
                                        {new Date(child.time).toLocaleString()}
                                      </span>
                                    </p>
                                    <p className='text-sm text-gray-800 mb-1'>{textOf(child)}</p>
                                  </div>

                                  {/* existing emphasis UI for child (unchanged) */}
                                  <div
                                    className={`relative group flex items-center space-x-1 ${canClickChild ? 'cursor-pointer' : 'cursor-not-allowed'}`}
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

                                    <div className='absolute hidden group-hover:block bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap top-1/2 -translate-y-1/2 right-full mr-2'>
                                      {childEmphasizedByNames.length > 0 ? (
                                        <div>
                                          <p className='font-semibold mb-1'>Emphasized by {childEmphasizedByNames.length} users</p>
                                        </div>
                                      ) : (
                                        'No emphasis yet'
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* actions row for replies */}
                                <div className='ml-0 flex items-center space-x-2 pl-2 text-sm mt-1'>
                                  {child.brother === brotherID && editingCommentId !== child.id && (
                                    <button
                                      onClick={() => handleEditComment(child.id, textOf(child))}
                                      className='text-gray-500 underline'
                                    >
                                      Edit
                                    </button>
                                  )}
                                </div>

                                {/* inline edit UI */}
                                {editingCommentId === child.id && (
                                  <div className='flex w-full items-start space-x-2 mt-1 pl-2'>
                                    <textarea
                                      value={editTexts[child.id] || ''}
                                      onChange={(e) =>
                                        setEditTexts(prev => ({ ...prev, [child.id]: e.target.value }))
                                      }
                                      className='border rounded p-1 text-sm w-full'
                                    />
                                    <button
                                      onClick={() => handleSaveEdit(child.id)}
                                      className='bg-green-600 text-white px-2 py-1 rounded text-xs'
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={handleCancelEdit}
                                      className='bg-gray-500 text-white px-2 py-1 rounded text-xs'
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                )}
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
          {/* Diversity + Coffee Chat Feedback */}
          <div className="p-4 rounded-lg shadow-md bg-white mt-4">
            <h3 className="text-lg font-semibold mb-4">Diversity Chat Feedback</h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Textarea */}
              <div className="md:col-span-3">
                <textarea
                  value={diversityChatFeedback}
                  onChange={(e) => setDiversityChatFeedback(e.target.value)}
                  className="w-full p-2 border rounded min-h-[150px] mb-2"
                />
              </div>

              {/* Dropdown */}
              <div>
                <label className="block text-sm font-medium mb-1">Select Rating</label>
                <select
                  value={diversityChatRating}
                  onChange={(e) => {
                    const selected = e.target.value;
                    setDiversityChatRating(selected);
                    handleAddRating(selected, 'diversity_chat_decision');
                  }}
                  className="w-full p-2 border rounded"
                >
                  {Object.entries(RusheeStatus).map(([key, label]) => (
                    <option key={key} value={label}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button
              onClick={() => {
                handleAddFeedback(
                  diversityChatFeedback,
                  'diversity_chat_feedback',
                  'diversity'
                );
              }}
              className="bg-[#8B0000] text-white px-3 py-1 rounded hover:bg-red-800"
            >
              Save Diversity Chat Feedback
            </button>
          </div>

          {/* Coffee Chat Feedback */}
          <div className="p-4 rounded-lg shadow-md bg-white mt-4">
            <h3 className="text-lg font-semibold mb-4">Coffee Chat Feedback</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Textarea */}
              <div className="md:col-span-3">
                <textarea
                  value={coffeeChatFeedback}
                  onChange={(e) => setCoffeeChatFeedback(e.target.value)}
                  className="w-full p-2 border rounded min-h-[150px] mb-2"
                />
              </div>

              {/* Dropdown */}
              <div>
                <label className="block text-sm font-medium mb-1">Select Rating</label>
                <select
                  value={coffeeChatRating}
                  onChange={
                    (e) => {
                      const selected = e.target.value;
                      setCoffeeChatRating(selected);
                      handleAddRating(selected, 'coffee_chat_decision');
                    }
                  }
                  className="w-full p-2 border rounded"
                >
                  {Object.entries(RusheeStatus).map(([key, label]) => (
                    <option key={key} value={label}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button
              onClick={() => {
                handleAddFeedback(
                  coffeeChatFeedback,
                  'coffee_chat_feedback',
                  'coffee'
                );
              }}
              className="bg-[#8B0000] text-white px-3 py-1 rounded hover:bg-red-800"
            >
              Save Coffee Chat Feedback
            </button>
          </div>
        </div>
      </div>
    </BrothersProvider>
  )
}
