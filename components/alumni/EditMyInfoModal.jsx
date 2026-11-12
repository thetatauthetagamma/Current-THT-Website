import React, { useState } from 'react'
import supabase from '@/supabase'

// Saves through update_my_alumni(). Filled-in fields become self-edited (the refresh leaves them alone for 2 years);
// fields left blank stay open for the LinkedIn refresh to fill (sync.mjs planChanges).
export default function EditMyInfoModal({ person, onClose, onSaved }) {
  const [company, setCompany] = useState(person.company ?? '')
  const [title, setTitle] = useState(person.title ?? '')
  const [location, setLocation] = useState(person.location ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    const { error } = await supabase.rpc('update_my_alumni', {
      p_company: company,
      p_title: title,
      p_location: location
    })
    setSaving(false)
    if (error) {
      setError('Could not save. Please try again.')
      return
    }
    onSaved()
  }

  const field = 'w-full p-2 border border-gray-300 rounded'

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <form onSubmit={save} className="bg-white rounded shadow-lg p-6 w-full max-w-md border-t-4 border-red-800">
        <h2 className="font-bold text-2xl mb-1">Edit my info</h2>
        <p className="text-gray-600 text-sm mb-4">
          What you fill in here won't be overwritten by the automatic LinkedIn refresh. Leave a field blank
          (for example, no company yet) and it fills in from your LinkedIn at the next refresh.
        </p>

        <label className="block text-sm font-bold mb-1" htmlFor="alumni-company">Current company</label>
        <input id="alumni-company" className={`${field} mb-3`} value={company} maxLength={120}
          onChange={(e) => setCompany(e.target.value)} />

        <label className="block text-sm font-bold mb-1" htmlFor="alumni-title">Title</label>
        <input id="alumni-title" className={`${field} mb-3`} value={title} maxLength={120}
          onChange={(e) => setTitle(e.target.value)} />

        <label className="block text-sm font-bold mb-1" htmlFor="alumni-location">Location</label>
        <input id="alumni-location" className={`${field} mb-4`} value={location} maxLength={120}
          placeholder="City, State" onChange={(e) => setLocation(e.target.value)} />

        {error && <p className="text-red-700 text-sm mb-3">{error}</p>}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={saving}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100">Cancel</button>
          <button type="submit" disabled={saving}
            className="px-4 py-2 bg-red-800 text-white rounded font-bold hover:bg-red-700 disabled:bg-gray-300">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  )
}
