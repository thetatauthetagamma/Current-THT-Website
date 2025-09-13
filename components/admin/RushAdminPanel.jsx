import React, { useState, useEffect } from 'react'
import supabase from '@/supabase'
import Papa from 'papaparse'

// Import react-datepicker
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

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
  }, [])

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
      <div className="mt-8 p-4 border rounded bg-gray-50">
        <button
          onClick={handleFinalizePC}
          className="bg-[#8B0000] text-white px-4 py-2 rounded hover:bg-red-800"
        >
          Finalize PC!!!!!!!!!!
        </button>
      </div>
    </div>
  )
}
