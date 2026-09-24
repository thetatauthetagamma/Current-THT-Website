import React, { useState, useEffect } from 'react'
import supabase from '@/supabase'
import Papa from 'papaparse'
import QRCodeModal from './QRCodeModal'
import JSZip from 'jszip'

// Import react-datepicker
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

// Constants for PPT placeholder replacement
const REQUIRED_PPT_FIELDS = [
  'full_name',
  'uniqname',
  'major',
  'year',
  'stars',
  'likes',
  'dislikes',
]

function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function replacePptPlaceholders(slideXml, row) {
  return slideXml.replace(
    /(<a:t\b[^>]*>)([\s\S]*?)(<\/a:t>)/g,
    (_, opening, text, closing) => {
      let updatedText = text

      REQUIRED_PPT_FIELDS.forEach((field) => {
        const tokenRegex = new RegExp(`\\b${field}\\b`, 'g')
        updatedText = updatedText.replace(
          tokenRegex,
          escapeXml(row[field] ?? '')
        )
      })

      return `${opening}${updatedText}${closing}`
    }
  )
}

function getXmlAttribute(tag, attribute) {
  return tag.match(new RegExp(`${attribute}="([^"]+)"`))?.[1]
}

export default function RushAdminPanel() {
  const [rushInfo, setRushInfo] = useState(null)

  // Store the dates as JavaScript Date objects
  const [appStartDate, setAppStartDate] = useState(null)
  const [appDueDate, setAppDueDate] = useState(null)

  // Questions
  const [questions, setQuestions] = useState([])
  const [newQuestionText, setNewQuestionText] = useState('')
  const [newWordCount, setNewWordCount] = useState('')
  const [newWordLimit, setNewWordLimit] = useState('')

  // Editing question
  const [editingQuestionId, setEditingQuestionId] = useState(null)
  const [editingQuestionText, setEditingQuestionText] = useState('')
  const [editingWordCount, setEditingWordCount] = useState('')
  const [editingWordLimit, setEditingWordLimit] = useState('')

  // ─────────────────────────────────────────────────────────
  //  CSV Upload (Round Cuts)
  // ─────────────────────────────────────────────────────────
  const [csvFile, setCsvFile] = useState(null)
  const [parsedUnames, setParsedUnames] = useState([])


  // ─────────────────────────────────────────────────────────
  // Final Rush Discussion PowerPoint Generation
  // ─────────────────────────────────────────────────────────
  const [finalRusheeCsvFile, setFinalRusheeCsvFile] = useState(null)
  const [finalRusheePptxFile, setFinalRusheePptxFile] = useState(null)
  const [finalRusheeRows, setFinalRusheeRows] = useState([])
  const [finalRusheeTemplate, setFinalRusheeTemplate] = useState(null)

  // Download non-brother attendee emails for a specific event as CSV
  async function handleDownloadEventRusheeEmails(eventId, eventName) {
    try {
      // Fetch all brothers' uniqnames (userid field)
      const { data: brothers, error: brothersError } = await supabase
        .from('Brothers')
        .select('userid')

      if (brothersError) {
        console.error('Error fetching brothers:', brothersError)
        alert('Failed to fetch brothers. Check console.')
        return
      }

      // Create a Set of brother uniqnames for quick lookup
      const brotherUniqnames = new Set((brothers || []).map(b => b.userid?.toLowerCase().trim()).filter(Boolean))

      // Fetch all attendance records for this event
      const { data: attendanceRecords, error: attendanceError } = await supabase
        .from('Rushee_Attendance')
        .select('uniqname')
        .eq('event_id', eventId)

      if (attendanceError) {
        console.error('Error fetching attendance records:', attendanceError)
        alert('Failed to fetch attendance records. Check console.')
        return
      }

      if (!attendanceRecords || attendanceRecords.length === 0) {
        alert('No attendance records found for this event.')
        return
      }

      // Filter to only non-brothers and format as emails
      const nonBrotherEmails = attendanceRecords
        .map(record => record.uniqname?.toLowerCase().trim())
        .filter(uniqname => uniqname && !brotherUniqnames.has(uniqname))
        .map(uniqname => `${uniqname}@umich.edu`)
        .sort()

      if (nonBrotherEmails.length === 0) {
        alert('No non-brother attendees found for this event.')
        return
      }

      // Create CSV content
      const csvContent = nonBrotherEmails.join('\n')

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      
      // Sanitize event name for filename
      const sanitizedEventName = eventName.replace(/[^a-z0-9]/gi, '_').toLowerCase()
      link.setAttribute('href', url)
      link.setAttribute('download', `rushee_emails_${sanitizedEventName}_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      alert(`Downloaded ${nonBrotherEmails.length} rushee emails!`)
    } catch (err) {
      console.error('Error downloading rushee emails:', err)
      alert('Something went wrong. Check console.')
    }
  }

  // Download brother attendee emails for a specific event as CSV
  async function handleDownloadEventBrotherEmails(eventId, eventName) {
    try {
      // Fetch all brothers' uniqnames (userid field)
      const { data: brothers, error: brothersError } = await supabase
        .from('Brothers')
        .select('userid')

      if (brothersError) {
        console.error('Error fetching brothers:', brothersError)
        alert('Failed to fetch brothers. Check console.')
        return
      }

      // Create a Set of brother uniqnames for quick lookup
      const brotherUniqnames = new Set((brothers || []).map(b => b.userid?.toLowerCase().trim()).filter(Boolean))

      // Fetch all attendance records for this event
      const { data: attendanceRecords, error: attendanceError } = await supabase
        .from('Rushee_Attendance')
        .select('uniqname')
        .eq('event_id', eventId)

      if (attendanceError) {
        console.error('Error fetching attendance records:', attendanceError)
        alert('Failed to fetch attendance records. Check console.')
        return
      }

      if (!attendanceRecords || attendanceRecords.length === 0) {
        alert('No attendance records found for this event.')
        return
      }

      // Filter to only brothers and format as emails
      const brotherEmails = attendanceRecords
        .map(record => record.uniqname?.toLowerCase().trim())
        .filter(uniqname => uniqname && brotherUniqnames.has(uniqname))
        .map(uniqname => `${uniqname}@umich.edu`)
        .sort()

      if (brotherEmails.length === 0) {
        alert('No brother attendees found for this event.')
        return
      }

      // Create CSV content
      const csvContent = brotherEmails.join('\n')

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      
      // Sanitize event name for filename
      const sanitizedEventName = eventName.replace(/[^a-z0-9]/gi, '_').toLowerCase()
      link.setAttribute('href', url)
      link.setAttribute('download', `brother_emails_${sanitizedEventName}_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      alert(`Downloaded ${brotherEmails.length} brother emails!`)
    } catch (err) {
      console.error('Error downloading brother emails:', err)
      alert('Something went wrong. Check console.')
    }
  }

  // ─────────────────────────────────────────────────────────
  //  Rush Events
  // ─────────────────────────────────────────────────────────
  const [rushEvents, setRushEvents] = useState([])
  const [showEventsSection, setShowEventsSection] = useState(false)
  const [newEventName, setNewEventName] = useState('')
  const [newEventDate, setNewEventDate] = useState(null)
  const [newEventLocation, setNewEventLocation] = useState('')
  const [newEventDescription, setNewEventDescription] = useState('')
  const [newEventOpen, setNewEventOpen] = useState(true) // Default to open/public
  const [newEventAttendance, setNewEventAttendance] = useState(false) // Default to no attendance
  const [nonBrotherAttendanceCounts, setNonBrotherAttendanceCounts] = useState({}) // { eventId: count }
  
  // Editing event
  const [editingEventId, setEditingEventId] = useState(null)
  const [editingEventName, setEditingEventName] = useState('')
  const [editingEventDate, setEditingEventDate] = useState(null)
  const [editingEventLocation, setEditingEventLocation] = useState('')
  const [editingEventDescription, setEditingEventDescription] = useState('')
  
  // QR Code Modal
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [selectedEventForQR, setSelectedEventForQR] = useState(null)

  // Admin role
  const [adminRole, setAdminRole] = useState('')
  const [isDevAdmin, setIsDevAdmin] = useState(false)

  // 1) Let user select a CSV
  function handleFileSelect(e) {
    if (e.target.files && e.target.files.length > 0) {
      setCsvFile(e.target.files[0])
    }
  }

  // 2) Parse CSV (assuming no header, each row has 1 column = uniqname)
  function handleParseCsv() {
    if (!csvFile) {
      alert('Please select a CSV file first.')
      return
    }

    Papa.parse(csvFile, {
      header: false,        // No header row
      skipEmptyLines: true, // Skip blank lines
      complete: (results) => {
        // results.data will be an array of arrays, e.g. [["jdoe"], ["katemcg"], ...]
        const rows = results.data
        // Map row[0] to get the uniqname, trim whitespace, filter empties
        const uniqnames = rows
          .map(row => row[0]?.trim())
          .filter(u => u && u.length > 0)

        if (uniqnames.length === 0) {
          alert('No valid uniqnames found in CSV.')
          return
        }

        setParsedUnames(uniqnames)
        alert(`Parsed ${uniqnames.length} uniqnames!`)
      },
      error: (err) => {
        console.error('PapaParse error:', err)
        alert('Error parsing CSV. See console.')
      }
    })
  }

  // 3) Eliminate others in Rushees table
  async function handleEliminateOthers() {
    if (parsedUnames.length === 0) {
      alert('No uniqnames parsed yet.')
      return
    }

    // Confirm with user
    const confirmMsg = `This will DELETE all Rushees NOT in:\n\n${parsedUnames.join('\n')}\n\nContinue?`
    if (!window.confirm(confirmMsg)) return

    try {
      // Delete from 'Rushees' where uniqname NOT in parsedUnames
      const safeList = `(${parsedUnames.join(',')})`
      const { error } = await supabase
        .from('Rushees')
        .update({ active: false })
        .not('uniqname', 'in', safeList)

      if (error) {
        console.error('Error eliminating rushees:', error)
        alert('Error eliminating rushees. Check console.')
        return
      }

      alert('Elimination complete! All other Rushees removed.')
      // Optionally fetch updated data, etc.
    } catch (err) {
      console.error('Error in handleEliminateOthers:', err)
      alert('Something went wrong. Check console.')
    }
  }

  // Final Rush discussion CSV and PPTX selection handlers
  function handleFinalRusheeCsvSelect(e) {
    setFinalRusheeCsvFile(e.target.files?.[0] || null)
    setFinalRusheeRows([])
    setFinalRusheeTemplate(null)
  }

  function handleFinalRusheePptxSelect(e) {
    setFinalRusheePptxFile(e.target.files?.[0] || null)
    setFinalRusheeRows([])
    setFinalRusheeTemplate(null)
  }

  async function handleParseFinalRusheeFiles() {
    if (!finalRusheeCsvFile || !finalRusheePptxFile) {
      alert('Please select both a CSV file and a PPTX template.')
      return
    }

    try {
      const rows = await new Promise((resolve, reject) => {
        Papa.parse(finalRusheeCsvFile, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => resolve(results.data || []),
          error: reject,
        })
      })

      if (!rows.length) {
        alert('The CSV does not contain any rushees.')
        return
      }

      const templateBuffer = await finalRusheePptxFile.arrayBuffer()
      const templateZip = await JSZip.loadAsync(templateBuffer)
      const slideFile = templateZip.file('ppt/slides/slide1.xml')

      if (!slideFile) {
        alert('The PPTX template does not contain ppt/slides/slide1.xml.')
        return
      }

      const slideXml = await slideFile.async('string')
      const textRuns = [...slideXml.matchAll(
        /<a:t\b[^>]*>([\s\S]*?)<\/a:t>/g
      )].map((match) => match[1]).join(' ')

      const missingFields = REQUIRED_PPT_FIELDS.filter(
        (field) => !new RegExp(`\\b${field}\\b`).test(textRuns)
      )

      if (missingFields.length > 0) {
        alert(
          `Template is missing placeholder(s): ${missingFields.join(', ')}`
        )
        return
      }

      setFinalRusheeRows(rows)
      setFinalRusheeTemplate(templateZip)
      alert(`Parsed ${rows.length} rushees.`)
    } catch (error) {
      console.error('Error parsing final rushee files:', error)
      alert('Failed to parse the CSV or PPTX template. Check the console.')
    }
  }

    async function handleGenerateFinalRusheePptx() {
    if (!finalRusheeTemplate || finalRusheeRows.length === 0) {
      alert('Please parse the CSV and PPTX files first.')
      return
    }

    try {
      const templateBuffer = await finalRusheeTemplate.generateAsync({
        type: 'arraybuffer',
      })
      const zip = await JSZip.loadAsync(templateBuffer)

      const templateSlide = await zip
        .file('ppt/slides/slide1.xml')
        .async('string')

      const presentationFile = zip.file('ppt/presentation.xml')
      const presentationRelsFile = zip.file(
        'ppt/_rels/presentation.xml.rels'
      )
      const contentTypesFile = zip.file('[Content_Types].xml')

      if (!presentationFile || !presentationRelsFile || !contentTypesFile) {
        throw new Error('Required PPTX presentation files are missing.')
      }

      let presentationXml = await presentationFile.async('string')
      let presentationRelsXml = await presentationRelsFile.async('string')
      let contentTypesXml = await contentTypesFile.async('string')

      const slide1Relationship = [
        ...presentationRelsXml.matchAll(
          /<Relationship\b[^>]*Target="slides\/slide1\.xml"[^>]*\/>/g
        ),
      ][0]?.[0]

      const slide1RelationshipId = slide1Relationship
        ? getXmlAttribute(slide1Relationship, 'Id')
        : null

      if (!slide1RelationshipId) {
        throw new Error('Could not find the template slide relationship.')
      }

      presentationRelsXml = presentationRelsXml.replace(
        slide1Relationship,
        ''
      )

      const originalSlideId = [
        ...presentationXml.matchAll(
          new RegExp(
            `<p:sldId\\b[^>]*r:id="${slide1RelationshipId}"[^>]*/>`,
            'g'
          )
        ),
      ][0]?.[0]

      if (!originalSlideId) {
        throw new Error('Could not find the template slide ID.')
      }

      presentationXml = presentationXml.replace(originalSlideId, '')

      contentTypesXml = contentTypesXml.replace(
        /<Override\b[^>]*PartName="\/ppt\/slides\/slide1\.xml"[^>]*\/>/g,
        ''
      )

      const relationshipIds = [
        ...presentationRelsXml.matchAll(/\bId="rId(\d+)"/g),
      ].map((match) => Number(match[1]))

      let nextRelationshipId =
        Math.max(0, ...relationshipIds) + 1

      const slideIds = [
        ...presentationXml.matchAll(/<p:sldId\b[^>]*id="(\d+)"/g),
      ].map((match) => Number(match[1]))

      let nextSlideId = Math.max(255, ...slideIds) + 1
      const newSlideEntries = []

      for (let index = 0; index < finalRusheeRows.length; index += 1) {
        const slideNumber = index + 2
        const row = finalRusheeRows[index]
        const slidePath = `ppt/slides/slide${slideNumber}.xml`
        const relationshipId = `rId${nextRelationshipId++}`
        const slideId = nextSlideId++

        const generatedSlideXml = replacePptPlaceholders(
          templateSlide,
          row
        )

        zip.file(slidePath, generatedSlideXml)

        const templateRelsPath =
          'ppt/slides/_rels/slide1.xml.rels'
        const templateRels = zip.file(templateRelsPath)

        if (templateRels) {
          const relsXml = await templateRels.async('string')
          zip.file(
            `ppt/slides/_rels/slide${slideNumber}.xml.rels`,
            relsXml
          )
        }

        presentationRelsXml = presentationRelsXml.replace(
          '</Relationships>',
          `<Relationship Id="${relationshipId}" ` +
            `Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" ` +
            `Target="slides/slide${slideNumber}.xml"/>` +
            '</Relationships>'
        )

        newSlideEntries.push(
          `<p:sldId id="${slideId}" r:id="${relationshipId}"/>`
        )

        contentTypesXml = contentTypesXml.replace(
          '</Types>',
          `<Override PartName="/ppt/slides/slide${slideNumber}.xml" ` +
            `ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>` +
            '</Types>'
        )
      }

      presentationXml = presentationXml.replace(
        '</p:sldIdLst>',
        `${newSlideEntries.join('')}</p:sldIdLst>`
      )

      zip.remove('ppt/slides/slide1.xml')
      zip.remove('ppt/slides/_rels/slide1.xml.rels')

      zip.file('ppt/presentation.xml', presentationXml)
      zip.file(
        'ppt/_rels/presentation.xml.rels',
        presentationRelsXml
      )
      zip.file('[Content_Types].xml', contentTypesXml)

      const outputBlob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(outputBlob)
      const link = document.createElement('a')

      link.href = url
      link.download =
        `final_rushees_${new Date().toISOString().slice(0, 10)}.pptx`
      link.style.visibility = 'hidden'

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      alert(
        `Successfully generated ${finalRusheeRows.length} slides.`
      )
    } catch (error) {
      console.error('Error generating final rushee PPTX:', error)
      alert('Failed to generate the PPTX. Check the console.')
    }
  }

  function handleResetFinalRushees() {
    setFinalRusheeCsvFile(null)
    setFinalRusheePptxFile(null)
    setFinalRusheeRows([])
    setFinalRusheeTemplate(null)

    const fileInputs = document.querySelectorAll(
      'input[data-final-rushee-file]'
    )
    fileInputs.forEach((input) => {
      input.value = ''
    })
  }

  async function handleFinalizePC() {
    // Confirm with user before proceeding
    const confirmMsg = `This will move all current rushees into the PNMs table and reset RushInfo. Please only do this once they have all accepted their bids. This action CANNOT be undone.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      // Fetch all active rushees
      const { data: rushees, error: fetchError } = await supabase
        .from('Rushees')
        .select('uniqname, firstname, lastname, major, year, pronouns')
        .eq('active', true);

      if (fetchError) {
        console.error('Error fetching active rushees:', fetchError);
        alert('Failed to fetch rushees. Check console.');
        return;
      }

      if (!rushees || rushees.length === 0) {
        alert('No active rushees to move.');
        return;
      }

      // Insert all rushees into the Pledges table
      const { error: insertError } = await supabase
        .from('Pledges')
        .insert(rushees); // Directly inserts the array

      if (insertError) {
        console.error('Error inserting PNMs:', insertError);
        alert('Error moving rushees to PNMs. Check console.');
        return;
      }


      // Mark all rushees as inactive
      const { error: updateError } = await supabase
        .from('Rushees')
        .update({ active: false })
        .eq('active', true);

      if (updateError) {
        console.error('Error marking rushees as inactive:', updateError);
        alert('Error updating rushee status. Check console.');
        return;
      }

      // Delete all rows from RushInfo
      const { error: deleteError } = await supabase.from('RushInfo').delete().neq('id', 0); // Delete all rows

      if (deleteError) {
        console.error('Error resetting RushInfo:', deleteError);
        alert('Error resetting RushInfo. Check console.');
        return;
      }

      alert('Rush finalized successfully! All active rushees moved to PNMs, RushInfo reset.');
    } catch (err) {
      console.error('Unexpected error in handleFinalizePC:', err);
      alert('Something went wrong. Check console.');
    }
  }

  // ─────────────────────────────────────────────────────────
  // EFFECTS
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    fetchRushInfo()
    fetchQuestions()
    fetchRushEvents()
    fetchAdminRole()
  }, [])

  // Fetch non-brother attendance counts when rush events change
  useEffect(() => {
    if (rushEvents.length > 0) {
      fetchNonBrotherAttendanceCounts()
    }
  }, [rushEvents])

  // Fetch admin role
  async function fetchAdminRole() {
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData?.session?.user?.email) return

      const email = sessionData.session.user.email
      const { data, error } = await supabase
        .from('Brothers')
        .select('adminrole')
        .eq('email', email)
        .single()

      if (!error && data) {
        setAdminRole(data.adminrole || '')
        setIsDevAdmin(data.adminrole === 'dev')
      }
    } catch (error) {
      console.error('Error fetching admin role:', error)
    }
  }

  // ─────────────────────────────────────────────────────────
  // RUSH INFO
  // ─────────────────────────────────────────────────────────
  async function fetchRushInfo() {
    const { data, error } = await supabase
      .from('RushInfo')
      .select('*')
      .single()

    if (error) {
      // If "Row not found", table might be empty
      console.log('No existing RushInfo row found or error:', error.message)
      setRushInfo(null)
      return
    }
    if (data) {
      setRushInfo(data)
      setAppStartDate(data.app_start_date ? new Date(data.app_start_date + 'T00:00:00') : null)
      setAppDueDate(data.app_due_date ? new Date(data.app_due_date + 'T00:00:00') : null)
    }
  }

  async function handleCreateRushInfo() {
    const { data, error } = await supabase
      .from('RushInfo')
      .insert([
        {
          app_start_date: appStartDate ? appStartDate.toLocaleDateString('en-CA') // produces "YYYY-MM-DD"
            : null,
          app_due_date: appDueDate ? appDueDate.toLocaleDateString('en-CA') : null,
        },
      ])
      .select('*')
      .single()

    if (error) {
      console.error('Error creating RushInfo:', error)
      alert('Failed to create RushInfo')
    } else {
      alert('Rush Info created successfully!')
      setRushInfo(data)
      setAppStartDate(data.app_start_date ? new Date(`${data.app_start_date}T00:00:00`) : null)
      setAppDueDate(data.app_due_date ? new Date(`${data.app_due_date}T00:00:00`) : null)
    }
  }

  async function handleSaveRushInfo() {
    if (!rushInfo) return

    const { data, error } = await supabase
      .from('RushInfo')
      .update({
        app_start_date: appStartDate ? appStartDate.toLocaleDateString('en-CA') : null,
        app_due_date: appDueDate ? appDueDate.toLocaleDateString('en-CA') : null,
      })
      .eq('id', rushInfo.id)
      .select('*')
      .single()

    if (error) {
      console.error('Error updating RushInfo:', error)
      alert('Failed to update RushInfo')
    } else {
      alert('Rush Info updated successfully!')
      setRushInfo(data)
    }
  }

  // ─────────────────────────────────────────────────────────
  // QUESTIONS
  // ─────────────────────────────────────────────────────────
  async function fetchQuestions() {
    const { data, error } = await supabase
      .from('Application_Questions')
      .select('*')
      .order('id', { ascending: true })

    if (error) {
      console.error('Error fetching questions:', error)
      return
    }
    setQuestions(data || [])
  }

  async function handleAddQuestion() {
    if (!newQuestionText.trim()) return

    const { data, error } = await supabase
      .from('Application_Questions')
      .insert([{
        question: newQuestionText,
        word_count: newWordCount ? parseInt(newWordCount) : null,
        word_limit: newWordLimit ? parseInt(newWordLimit) : null
      }])
      .single()

    if (error) {
      console.error('Error adding question:', error)
      alert('Failed to add question')
    } else {
      alert('Question added!')
      setNewQuestionText('')
      setNewWordCount('')
      setNewWordLimit('')
      fetchQuestions()
    }
  }

  function handleEditQuestion(q) {
    setEditingQuestionId(q.id)
    setEditingQuestionText(q.question)
    setEditingWordCount(q.word_count ? q.word_count.toString() : '')
    setEditingWordLimit(q.word_limit ? q.word_limit.toString() : '')
  }

  async function handleSaveQuestionEdit(questionId) {
    if (!editingQuestionText.trim()) return

    const { error } = await supabase
      .from('Application_Questions')
      .update({
        question: editingQuestionText,
        word_count: editingWordCount ? parseInt(editingWordCount) : null,
        word_limit: editingWordLimit ? parseInt(editingWordLimit) : null
      })
      .eq('id', questionId)

    if (error) {
      console.error('Error editing question:', error)
      alert('Failed to edit question')
    } else {
      alert('Question updated!')
      setEditingQuestionId(null)
      setEditingQuestionText('')
      setEditingWordCount('')
      setEditingWordLimit('')
      fetchQuestions()
    }
  }

  async function handleDeleteQuestion(questionId) {
    const isSure = window.confirm('Are you sure you want to delete this question?')
    if (!isSure) return

    const { error } = await supabase
      .from('Application_Questions')
      .delete()
      .eq('id', questionId)

    if (error) {
      console.error('Error deleting question:', error)
      alert('Failed to delete question')
    } else {
      alert('Question deleted!')
      fetchQuestions()
    }
  }

  // ─────────────────────────────────────────────────────────
  // RUSH EVENTS
  // ─────────────────────────────────────────────────────────
  async function fetchRushEvents() {
    try {
      const { data, error } = await supabase
        .from('RushEvents')
        .select('*')
        .order('date', { ascending: true })
        .order('id', { ascending: true })

      if (error) {
        console.error('Error fetching rush events:', error)
        return
      }
      const eventsData = data || []
      setRushEvents(eventsData)
      // Fetch attendance counts with the fresh data
      if (eventsData.length > 0) {
        fetchNonBrotherAttendanceCounts(eventsData)
      } else {
        setNonBrotherAttendanceCounts({})
      }
    } catch (error) {
      console.error('Error fetching rush events:', error)
    }
  }

  // Fetch non-brother attendance counts for all events
  async function fetchNonBrotherAttendanceCounts(events = null) {
    try {
      // Use provided events or fall back to state
      const eventsToUse = events || rushEvents
      
      // Get all unique event IDs that have attendance enabled
      const eventsWithAttendance = eventsToUse.filter(e => e.attendance).map(e => e.id)
      
      if (eventsWithAttendance.length === 0) {
        setNonBrotherAttendanceCounts({})
        return
      }

      // Fetch all brothers' uniqnames (userid field)
      const { data: brothers, error: brothersError } = await supabase
        .from('Brothers')
        .select('userid')

      if (brothersError) {
        console.error('Error fetching brothers:', brothersError)
        return
      }

      // Create a Set of brother uniqnames for quick lookup
      const brotherUniqnames = new Set((brothers || []).map(b => b.userid?.toLowerCase().trim()).filter(Boolean))

      // Fetch all attendance records for these events
      const { data: attendanceRecords, error: attendanceError } = await supabase
        .from('Rushee_Attendance')
        .select('event_id, uniqname')
        .in('event_id', eventsWithAttendance)

      if (attendanceError) {
        console.error('Error fetching attendance records:', attendanceError)
        return
      }

      // Count non-brother attendance per event
      const counts = {}
      eventsWithAttendance.forEach(eventId => {
        counts[eventId] = 0
      })

      if (attendanceRecords && attendanceRecords.length > 0) {
        attendanceRecords.forEach(record => {
          const uniqname = record.uniqname?.toLowerCase().trim()
          if (uniqname && !brotherUniqnames.has(uniqname)) {
            // This person is not a brother, count them
            counts[record.event_id] = (counts[record.event_id] || 0) + 1
          }
        })
      }

      setNonBrotherAttendanceCounts(counts)
    } catch (error) {
      console.error('Error fetching non-brother attendance counts:', error)
    }
  }

  // Helper function to get the next available ID
  async function getNextAvailableId() {
    try {
      const { data, error } = await supabase
        .from('RushEvents')
        .select('id')
        .order('id', { ascending: false })
        .limit(1)

      if (error) {
        console.error('Error fetching max ID:', error)
        // If there's an error, default to 1
        return 1
      }

      if (!data || data.length === 0) {
        // No events exist yet, start at 1
        return 1
      }

      // Return max ID + 1
      return (data[0].id || 0) + 1
    } catch (error) {
      console.error('Error getting next available ID:', error)
      return 1
    }
  }

  // Helper function to generate a hard-to-guess attendance key
  function generateAttendanceKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let key = ''
    for (let i = 0; i < 32; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return key
  }

  async function handleAddRushEvent() {
    if (!newEventName.trim()) {
      alert('Please enter an event name')
      return
    }
    if (!newEventDate) {
      alert('Please select a date and time')
      return
    }

    try {
      // Get the next available ID
      const nextId = await getNextAvailableId()

      // Generate a hard-to-guess attendance key
      const attendanceKey = generateAttendanceKey()

      const { data, error } = await supabase
        .from('RushEvents')
        .insert([{
          id: nextId,
          name: newEventName.trim(),
          date: newEventDate.toISOString(),
          location: newEventLocation.trim() || null,
          description: newEventDescription.trim() || null,
          open: newEventOpen,
          attendance: newEventAttendance,
          attendance_key: attendanceKey
        }])
        .select()

      if (error) {
        console.error('Error adding rush event:', error)
        alert(`Failed to add rush event: ${error.message}`)
        return
      }
      
      alert('Rush event added!')
      setNewEventName('')
      setNewEventDate(null)
      setNewEventLocation('')
      setNewEventDescription('')
      setNewEventOpen(true)
      setNewEventAttendance(false)
      await fetchRushEvents()
    } catch (error) {
      console.error('Error adding rush event:', error)
      alert(`Failed to add rush event: ${error.message}`)
    }
  }

  function handleEditEvent(event) {
    setEditingEventId(event.id)
    setEditingEventName(event.name)
    setEditingEventDate(event.date ? new Date(event.date) : null)
    setEditingEventLocation(event.location || '')
    setEditingEventDescription(event.description || '')
  }

  function handleCancelEditEvent() {
    setEditingEventId(null)
    setEditingEventName('')
    setEditingEventDate(null)
    setEditingEventLocation('')
    setEditingEventDescription('')
  }

  async function handleSaveEventEdit(eventId) {
    if (!editingEventName.trim()) {
      alert('Please enter an event name')
      return
    }
    if (!editingEventDate) {
      alert('Please select a date and time')
      return
    }

    try {
      const { error } = await supabase
        .from('RushEvents')
        .update({
          name: editingEventName.trim(),
          date: editingEventDate.toISOString(),
          location: editingEventLocation.trim() || null,
          description: editingEventDescription.trim() || null
        })
        .eq('id', eventId)

      if (error) {
        console.error('Error updating event:', error)
        alert('Failed to update event')
      } else {
        alert('Event updated!')
        handleCancelEditEvent()
        await fetchRushEvents()
      }
    } catch (error) {
      console.error('Error updating event:', error)
      alert('Failed to update event')
    }
  }

  async function handleUpdateEventFields(eventId, field, value) {
    try {
      const { error } = await supabase
        .from('RushEvents')
        .update({ [field]: value })
        .eq('id', eventId)

      if (error) {
        console.error(`Error updating event ${field}:`, error)
        alert(`Failed to update event ${field}`)
        // Refresh to revert UI changes
        fetchRushEvents()
      } else {
        // Update local state immediately for better UX
        setRushEvents(prevEvents =>
          prevEvents.map(event =>
            event.id === eventId ? { ...event, [field]: value } : event
          )
        )
        // Refresh attendance counts if attendance field changed
        if (field === 'attendance') {
          setTimeout(() => fetchNonBrotherAttendanceCounts(), 100)
        }
      }
    } catch (error) {
      console.error(`Error updating event ${field}:`, error)
      alert(`Failed to update event ${field}`)
      fetchRushEvents()
    }
  }

  async function handleDeleteRushEvent(eventId) {
    const isSure = window.confirm('Are you sure you want to delete this rush event?')
    if (!isSure) return

    try {
      const { error } = await supabase
        .from('RushEvents')
        .delete()
        .eq('id', eventId)

      if (error) {
        console.error('Error deleting rush event:', error)
        alert('Failed to delete rush event')
      } else {
        alert('Rush event deleted!')
        await fetchRushEvents()
      }
    } catch (error) {
      console.error('Error deleting rush event:', error)
      alert('Failed to delete rush event')
    }
  }

  async function handleRegenerateAttendanceKey(eventId) {
    const isSure = window.confirm('Are you sure you want to regenerate the attendance key? The old link will no longer work.')
    if (!isSure) return

    try {
      const attendanceKey = generateAttendanceKey()
      
      const { error } = await supabase
        .from('RushEvents')
        .update({ attendance_key: attendanceKey })
        .eq('id', eventId)

      if (error) {
        console.error('Error regenerating attendance key:', error)
        alert('Failed to regenerate attendance key')
      } else {
        alert('Attendance key regenerated successfully!')
        fetchRushEvents()
      }
    } catch (error) {
      console.error('Error regenerating attendance key:', error)
      alert('Failed to regenerate attendance key')
    }
  }

  // ─────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────
  return (
    <div className="bg-white rounded-md shadow-md p-4 w-full">
      <h2 className="text-2xl font-bold mb-6 text-[#8B0000]">
        Rush Settings
      </h2>

      {/** RUSH INFO FORM SECTION */}
      <div className="mb-8">
        {!rushInfo ? (
          /** If no row in RushInfo, prompt user to create one */
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <h3 className="text-lg font-semibold mb-4">No RushInfo Found</h3>
            <p className="mb-4 text-gray-600">
              Create a new RushInfo entry by selecting a start date, due date.
            </p>
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div>
                <label className="block font-medium mb-1">Start Date:</label>
                <DatePicker
                  selected={appStartDate}
                  onChange={(date) => setAppStartDate(date)}

                  showTimeSelect
                  dateFormat="yyyy-MM-dd"
                  placeholderText="Select Start"
                  className="border rounded p-1 w-full"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Due Date:</label>
                <DatePicker
                  selected={appDueDate}
                  onChange={(date) => setAppDueDate(date)}
                  showTimeSelect
                  dateFormat="yyyy-MM-dd"
                  placeholderText="Select Due"
                  className="border rounded p-1 w-full"
                />
              </div>
            </div>
            <button
              onClick={handleCreateRushInfo}
              className="mt-4 bg-[#8B0000] text-white px-4 py-2 rounded hover:bg-red-800"
            >
              Add Rush Info
            </button>
          </div>
        ) : (
          /** If we do have RushInfo, show the edit form */
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <h3 className="text-lg font-semibold ">Application Dates</h3>
            <p className="text-sm text-gray-600 mb-4">(Disregard times)</p>
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div>
                <label className="block font-medium mb-1">Start Date:</label>
                <DatePicker
                  selected={appStartDate}
                  onChange={(date) => setAppStartDate(date)}
                  showTimeSelect
                  dateFormat="yyyy-MM-dd"
                  placeholderText="Select Start"
                  className="border rounded p-1 w-full"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Due Date:</label>
                <DatePicker
                  selected={appDueDate}
                  onChange={(date) => setAppDueDate(date)}
                  showTimeSelect
                  dateFormat="yyyy-MM-dd"
                  placeholderText="Select Due"
                  className="border rounded p-1 w-full"
                />
              </div>
            </div>
            <button
              onClick={handleSaveRushInfo}
              className="mt-4 bg-[#8B0000] text-white px-4 py-2 rounded hover:bg-red-800"
            >
              Save Rush Info
            </button>
          </div>
        )}
      </div>

      {/** RUSH EVENTS SECTION */}
      <div className="mb-8 border border-gray-200 rounded-lg p-4 bg-gray-50">
        <button
          onClick={() => setShowEventsSection(!showEventsSection)}
          className="w-full flex items-center justify-between text-left"
        >
          <h3 className="text-lg font-semibold text-[#8B0000]">
            Rush Events
          </h3>
          <svg
            className={`w-5 h-5 transform transition-transform ${showEventsSection ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {showEventsSection && (
          <div className="mt-4 space-y-4">
            {/* Add New Event Form */}
            <div className="bg-white rounded p-4 border border-gray-300">
              <h4 className="font-semibold mb-3 text-[#8B0000]">Add New Rush Event</h4>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Event Name *"
                  value={newEventName}
                  onChange={(e) => setNewEventName(e.target.value)}
                  className="w-full border rounded p-2 outline-none"
                />
                <div>
                  <label className="block text-sm font-medium mb-1">Date & Time *</label>
                  <DatePicker
                    selected={newEventDate}
                    onChange={(date) => setNewEventDate(date)}
                    showTimeSelect
                    dateFormat="yyyy-MM-dd h:mm aa"
                    placeholderText="Select date and time"
                    className="w-full border rounded p-2"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Location (optional)"
                  value={newEventLocation}
                  onChange={(e) => setNewEventLocation(e.target.value)}
                  className="w-full border rounded p-2 outline-none"
                />
                <textarea
                  placeholder="Description (optional)"
                  value={newEventDescription}
                  onChange={(e) => setNewEventDescription(e.target.value)}
                  className="w-full border rounded p-2 outline-none"
                  rows={3}
                />
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newEventOpen}
                      onChange={(e) => setNewEventOpen(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium">Publicly Visible (Open)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newEventAttendance}
                      onChange={(e) => setNewEventAttendance(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium">Take Attendance</span>
                  </label>
                </div>
                <button
                  onClick={handleAddRushEvent}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Add Event
                </button>
              </div>
            </div>

            {/* Existing Events List */}
            <div>
              <h4 className="font-semibold mb-2 text-[#8B0000]">Existing Events ({rushEvents.length})</h4>
              {rushEvents.length === 0 ? (
                <p className="text-gray-600 text-sm">No rush events yet.</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {rushEvents.map((event) => {
                    const eventDate = event.date ? new Date(event.date) : null
                    const isEditing = editingEventId === event.id
                    
                    return (
                      <div
                        key={event.id}
                        className="bg-white rounded p-3 border border-gray-300 flex flex-col gap-2"
                      >
                        {isEditing ? (
                          // Edit Mode
                          <div className="w-full space-y-3">
                            <input
                              type="text"
                              placeholder="Event Name *"
                              value={editingEventName}
                              onChange={(e) => setEditingEventName(e.target.value)}
                              className="w-full border rounded p-2 outline-none"
                            />
                            <div>
                              <label className="block text-sm font-medium mb-1">Date & Time *</label>
                              <DatePicker
                                selected={editingEventDate}
                                onChange={(date) => setEditingEventDate(date)}
                                showTimeSelect
                                dateFormat="yyyy-MM-dd h:mm aa"
                                placeholderText="Select date and time"
                                className="w-full border rounded p-2"
                              />
                            </div>
                            <input
                              type="text"
                              placeholder="Location (optional)"
                              value={editingEventLocation}
                              onChange={(e) => setEditingEventLocation(e.target.value)}
                              className="w-full border rounded p-2 outline-none"
                            />
                            <textarea
                              placeholder="Description (optional)"
                              value={editingEventDescription}
                              onChange={(e) => setEditingEventDescription(e.target.value)}
                              className="w-full border rounded p-2 outline-none"
                              rows={3}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSaveEventEdit(event.id)}
                                className="bg-[#8B0000] text-white px-3 py-1 rounded hover:bg-red-800 text-sm"
                              >
                                Save
                              </button>
                              <button
                                onClick={handleCancelEditEvent}
                                className="bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500 text-sm"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          // Display Mode
                          <>
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                              <div className="flex-1">
                                <div className="font-semibold text-gray-800 flex items-center gap-2 mb-2">
                                  {event.name}
                                  {event.open && (
                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">Public</span>
                                  )}
                                  {event.attendance && (
                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Attendance</span>
                                  )}
                                  {event.attendance && nonBrotherAttendanceCounts[event.id] !== undefined && (
                                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                                      Rushees: {nonBrotherAttendanceCounts[event.id]}
                                    </span>
                                  )}
                                </div>
                                {eventDate && (
                                  <div className="text-sm text-gray-600">
                                    {eventDate.toLocaleDateString('en-US', {
                                      weekday: 'long',
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric',
                                      hour: 'numeric',
                                      minute: '2-digit',
                                      hour12: true
                                    })}
                                  </div>
                                )}
                                {event.location && (
                                  <div className="text-sm text-gray-500">📍 {event.location}</div>
                                )}
                                {event.description && (
                                  <div className="text-sm text-gray-600 mt-1">{event.description}</div>
                                )}
                                {/* Edit checkboxes */}
                                <div className="flex gap-4 mt-2 pt-2 border-t border-gray-200">
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={event.open || false}
                                      onChange={(e) => handleUpdateEventFields(event.id, 'open', e.target.checked)}
                                      className="w-4 h-4"
                                    />
                                    <span className="text-xs font-medium text-gray-700">Publicly Visible</span>
                                  </label>
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={event.attendance || false}
                                      onChange={(e) => handleUpdateEventFields(event.id, 'attendance', e.target.checked)}
                                      className="w-4 h-4"
                                    />
                                    <span className="text-xs font-medium text-gray-700">Take Attendance</span>
                                  </label>
                                </div>
                              </div>
                              <div className="flex gap-2 flex-col sm:flex-row">
                                <button
                                  onClick={() => handleEditEvent(event)}
                                  className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 text-sm whitespace-nowrap"
                                >
                                  Edit
                                </button>
                                {event.attendance && (
                                  <>
                                    <button
                                      onClick={() => {
                                        setSelectedEventForQR(event)
                                        setQrModalOpen(true)
                                      }}
                                      className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm whitespace-nowrap"
                                    >
                                      QR Code
                                    </button>
                                    <button
                                      onClick={() => handleDownloadEventRusheeEmails(event.id, event.name)}
                                      className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-sm whitespace-nowrap"
                                      title="Download CSV of rushee emails who attended this event"
                                    >
                                      Emails
                                    </button>
                                    <button
                                      onClick={() => handleDownloadEventBrotherEmails(event.id, event.name)}
                                      className="bg-orange-500 text-white px-3 py-1 rounded hover:bg-orange-600 text-sm whitespace-nowrap"
                                      title="Download CSV of brother emails who attended this event"
                                    >
                                      Brothers
                                    </button>
                                  </>
                                )}
                                {isDevAdmin && event.attendance && (
                                  <button
                                    onClick={() => handleRegenerateAttendanceKey(event.id)}
                                    className="bg-purple-500 text-white px-3 py-1 rounded hover:bg-purple-600 text-sm whitespace-nowrap"
                                    title="Regenerate attendance key (dev only)"
                                  >
                                    Regenerate Key
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteRushEvent(event.id)}
                                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm whitespace-nowrap"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/** QUESTIONS SECTION */}
      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
        <h3 className="text-lg font-semibold mb-4 text-[#8B0000]">
          Application Questions
        </h3>

        {/** Add new question */}
        <div className="mb-4">
          <div className="flex flex-col gap-2 mb-2">
            <input
              type="text"
              placeholder="Enter new question text..."
              value={newQuestionText}
              onChange={(e) => setNewQuestionText(e.target.value)}
              className="border rounded p-2 outline-none"
            />
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Suggested word count (optional)"
                value={newWordCount}
                onChange={(e) => setNewWordCount(e.target.value)}
                className="flex-1 border rounded p-2 outline-none"
                min="1"
              />
              <input
                type="number"
                placeholder="Word limit (required)"
                value={newWordLimit}
                onChange={(e) => setNewWordLimit(e.target.value)}
                className="flex-1 border rounded p-2 outline-none"
                min="1"
              />
            </div>
          </div>
          <button
            onClick={handleAddQuestion}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Add Question
          </button>
        </div>

        {/** Questions list */}
        <div className="space-y-2">
          {questions.map((q) => (
            <div
              key={q.id}
              className="flex flex-col md:flex-row items-start md:items-center justify-between border rounded p-2 bg-white"
            >
              {editingQuestionId === q.id ? (
                <div className="flex flex-col w-full gap-2">
                  <input
                    type="text"
                    value={editingQuestionText}
                    onChange={(e) => setEditingQuestionText(e.target.value)}
                    className="border rounded p-2"
                    placeholder="Question text"
                  />
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={editingWordCount}
                      onChange={(e) => setEditingWordCount(e.target.value)}
                      className="flex-1 border rounded p-2"
                      placeholder="Suggested count"
                      min="1"
                    />
                    <input
                      type="number"
                      value={editingWordLimit}
                      onChange={(e) => setEditingWordLimit(e.target.value)}
                      className="flex-1 border rounded p-2"
                      placeholder="Word limit"
                      min="1"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleSaveQuestionEdit(q.id)}
                      className="bg-[#8B0000] text-white px-3 py-1 rounded hover:bg-red-800"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingQuestionId(null)
                        setEditingQuestionText('')
                        setEditingWordCount('')
                        setEditingWordLimit('')
                      }}
                      className="bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1 mb-2 md:mb-0 mr-2">
                    <span className="text-gray-800 font-medium block">
                      {q.question}
                    </span>
                    <div className="text-gray-500 text-sm space-x-4">
                      {q.word_count && (
                        <span>Suggested: {q.word_count} words</span>
                      )}
                      {q.word_limit && (
                        <span className="font-semibold">Limit: {q.word_limit} words</span>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditQuestion(q)}
                      className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/** CSV UPLOAD FOR ROUND CUTS */}
      <div className="mt-8 p-4 border rounded bg-gray-50">
        <h2 className="text-lg font-semibold mb-2 text-[#8B0000]">
          Round Cuts (CSV Upload)
        </h2>
        <p className="text-sm text-gray-600 mb-3">
          Upload a CSV file where each row’s first column is a single uniqname (no header) of rushees ADVANCING TO THE NEXT ROUND OF RUSH.
        </p>

        <input
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="mb-2"
        />
        <div className="flex space-x-2">
          <button
            onClick={handleParseCsv}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Parse CSV
          </button>
          <button
            onClick={handleEliminateOthers}
            className="bg-[#8B0000] text-white px-4 py-2 rounded hover:bg-red-800"
          >
            Eliminate Others
          </button>

        </div>

        {/* If some names were parsed, show them */}
        {parsedUnames.length > 0 && (
          <div className="mt-4 text-sm text-gray-700">
            <p className="font-semibold">
              Parsed Uniqnames ({parsedUnames.length}):
            </p>
            <ul className="list-disc list-inside">
              {parsedUnames.map((uname) => (
                <li key={uname}>{uname}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {/**CSV, PPTX UPLOAD FOR FINAL RUSH DISCUSSION */}
      <div className="mt-8 p-4 border rounded bg-gray-50">
        <h2 className="text-lg font-semibold mb-2 text-[#8B0000]">
          Final Rushees (CSV, PPTX Upload)
        </h2>
          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-3">
              Upload a final rushee CSV and a one-slide PPTX template
              containing the required placeholders.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block font-medium mb-1">
                  Final Rushees CSV
                </label>
                <input
                  data-final-rushee-file
                  type="file"
                  accept=".csv"
                  onChange={handleFinalRusheeCsvSelect}
                />
              </div>

              <div>
                <label className="block font-medium mb-1">
                  PowerPoint Template
                </label>
                <input
                  data-final-rushee-file
                  type="file"
                  accept=".pptx"
                  onChange={handleFinalRusheePptxSelect}
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleParseFinalRusheeFiles}
                  disabled={!finalRusheeCsvFile || !finalRusheePptxFile}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
                >
                  Parse Files
                </button>

                {finalRusheeRows.length > 0 && (
                  <button
                    onClick={handleResetFinalRushees}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                  >
                    Start Over
                  </button>
                )}
              </div>
            </div>

            {finalRusheeRows.length > 0 && (
              <div className="mt-4 text-sm text-gray-700">
                <p className="font-semibold mb-2">
                  Parsed {finalRusheeRows.length} rushees:
                </p>

                <ul className="list-disc list-inside max-h-64 overflow-y-auto">
                  {finalRusheeRows.map((row, index) => (
                    <li key={`${row.uniqname}-${index}`}>
                      <span className="font-medium">
                        {row.full_name}
                      </span>
                      {' — '}
                      {row.uniqname}
                      {' — '}
                      {row.major}
                      {' — '}
                      {row.year}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={handleGenerateFinalRusheePptx}
                  className="mt-4 bg-[#8B0000] text-white px-4 py-2 rounded hover:bg-red-800"
                >
                  Confirm & Download PPTX
                </button>
              </div>
            )}
          </div>
      </div>
      <div className="mt-8 p-4 border rounded bg-gray-50">
        <button
          onClick={handleFinalizePC}
          className="bg-[#8B0000] text-white px-4 py-2 rounded hover:bg-red-800"
        >
          Finalize PC!!!!!!!!!!
        </button>
      </div>

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={qrModalOpen}
        onClose={() => {
          setQrModalOpen(false)
          setSelectedEventForQR(null)
        }}
        eventId={selectedEventForQR?.id}
        eventName={selectedEventForQR?.name}
        attendanceKey={selectedEventForQR?.attendance_key}
      />
    </div>
  )
}
