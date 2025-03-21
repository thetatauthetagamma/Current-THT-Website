import React, { useState, useEffect } from 'react'
import supabase from '@/supabase'
import Papa from 'papaparse'

// Import react-datepicker
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

export default function BLPairAdder() {
  // ─────────────────────────────────────────────────────────
  //  CSV Upload (Round Cuts)
  // ─────────────────────────────────────────────────────────
  const [csvFile, setCsvFile] = useState(null)
  const [pairings, setPairings] = useState([])
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // 1) Let user select a CSV
  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setCsvFile(e.target.files[0])
      setError(null)
      setSuccess(null)
    }
  }

  // 2) Parse CSV - want big/little header, and so final data is [[big, little], [big, little]]
  const handleParseCsv = () => {
    if (!csvFile) {
      setError('Please select a CSV file first.')
      return
    }

    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {  // Make callback async to handle DB query
        const headers = results.meta.fields
        
        // Validate headers
        if (!headers || headers.length !== 2 || 
            headers[0].toLowerCase() !== 'littleuserid' || 
            headers[1].toLowerCase() !== 'biguserid') {
          setError('Invalid CSV format. Headers must be "littleuserid" and "biguserid" (case insensitive).')
          return
        }

        // Process the data
        const validPairings = results.data
          .filter(row => row.littleuserid && row.biguserid)
          .map(row => ({
            littleuserid: row.littleuserid.trim(),
            biguserid: row.biguserid.trim()
          }))

        if (validPairings.length === 0) {
          setError('No valid pairings found in CSV.')
          return
        }

        // Get unique IDs to verify
        const uniqueIds = [...new Set([
          ...validPairings.map(p => p.littleuserid),
          ...validPairings.map(p => p.biguserid)
        ])]

        // Check if all IDs exist in Brothers table
        const { data: existingBrothers, error: brothersError } = await supabase
          .from('Brothers')
          .select('userid')
          .in('userid', uniqueIds)

        if (brothersError) {
          setError('Some IDs are not valid brothers. Please check the file and try again.')
          console.error('Error:', brothersError)
          return
        }

        //Find any invalid IDs
        const validIds = new Set(existingBrothers.map(b => b.userid))
        const invalidIds = uniqueIds.filter(id => !validIds.has(id))

        if (invalidIds.length > 0) {
          setError(`Some IDs are not valid brothers. Please check the file and try again.`)
          return
        }

        setPairings(validPairings)
        setSuccess(`Successfully parsed ${validPairings.length} pairings!`)
      },
      error: (err) => {
        setError('Error parsing CSV file. Please check the file format.')
        console.error('PapaParse error:', err)
      }
    })
  }



  const handleAddPairings = async () => {
    if (pairings.length === 0) {
      setError('No valid pairings to add.')
      return
    }

    try {
      const { error: insertError } = await supabase
        .from('BigLittlePairings')
        .insert(pairings)

      if (insertError) {
        setError('Error inserting pairings into database.')
        console.error('Insert error:', insertError)
        return
      }

      // Reset all states immediately
      setPairings([])
      setCsvFile(null)
      setError(null)
      // Reset the file input
      const fileInput = document.querySelector('input[type="file"]')
      if (fileInput) {
        fileInput.value = ''
      }
      setSuccess(`Successfully added pairings to database!`)

    } catch (err) {
      setError('An unexpected error occurred.')
      console.error('Error in handleAddPairings:', err)
    }
  }


  // ─────────────────────────────────────────────────────────
  // EFFECTS
  // ─────────────────────────────────────────────────────────

  // ─────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────
  return (
    <div className="bg-white rounded-md shadow-md p-4 w-full">
      <h2 className="text-2xl font-bold mb-6 text-[#8B0000]">
        Big-Little Pairing Upload
      </h2>

      {/** CSV UPLOAD SECTION */}
      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
        <h3 className="text-lg font-semibold mb-4 text-[#8B0000]">
          Upload Big-Little Pairings
        </h3>
        <p className="text-sm text-gray-600 mb-3">
          Upload a CSV file with headers "little" and "big" containing the uniqnames of paired members.
        </p>

        <input
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="mb-4"
        />

        <div className="flex space-x-2">
          <button
            onClick={handleParseCsv}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Parse CSV
          </button>
          <button
            onClick={handleAddPairings}
            disabled={pairings.length === 0}
            className="bg-[#8B0000] text-white px-4 py-2 rounded hover:bg-red-800 disabled:bg-gray-400"
          >
            Add Pairings
          </button>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
        {success && (
          <div className="mt-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            {success}
          </div>
        )}

        {/* Preview Section */}
        {pairings.length > 0 && (
          <div className="mt-4">
            <h4 className="font-semibold mb-2">
              Preview Pairings ({pairings.length}):
            </h4>
            <div className="max-h-60 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Little</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Big</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pairings.map((pair, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{pair.littleuserid}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{pair.biguserid}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
