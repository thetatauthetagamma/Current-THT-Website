import { useState, useEffect } from 'react'
import supabase from '@/supabase'

// Simple types for a row in Pledge_Requirements
interface PledgeRequirement {
  id: number
  type: 'pd' | 'committee'
  requirement: string
}

export default function PledgeRequirementsManager() {
  // State to hold all rows from the DB
  const [requirements, setRequirements] = useState<PledgeRequirement[]>([])

  // State for new row inputs
  const [newType, setNewType] = useState<'pd' | 'committee'>('pd')
  const [newRequirement, setNewRequirement] = useState('')

  // For editing an existing row inline
  const [editRowId, setEditRowId] = useState<number | null>(null)
  const [editType, setEditType] = useState<'pd' | 'committee'>('pd')
  const [editRequirement, setEditRequirement] = useState('')

  // ─────────────────────────────────────────────────────────
  // 1) Fetch all existing requirements on mount
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchRequirements = async () => {
      const { data, error } = await supabase
        .from('Pledge_Requirements')
        .select('*')
        .order('id', { ascending: true })
      if (error) {
        console.error('Error fetching Pledge_Requirements:', error)
      } else if (data) {
        setRequirements(data as PledgeRequirement[])
      }
    }
    fetchRequirements()
  }, [])

  // ─────────────────────────────────────────────────────────
  // 2) Add a new requirement
  // ─────────────────────────────────────────────────────────
  async function handleAdd() {
    // Basic validation
    if (!newRequirement.trim()) {
      alert('Please enter a requirement description.')
      return
    }

    // Insert row
    const { data, error } = await supabase
      .from('Pledge_Requirements')
      .insert([{ type: newType, requirement: newRequirement }])
      .select('*')
      .single()

    if (error) {
      console.error('Error inserting requirement:', error)
      return
    }

    // If successful, push the new row into local state
    if (data) {
      setRequirements(prev => [...prev, data])
    }
    // Reset inputs
    setNewRequirement('')
    setNewType('pd')
  }

  // ─────────────────────────────────────────────────────────
  // 3) Start editing an existing row
  // ─────────────────────────────────────────────────────────
  function handleStartEdit(row: PledgeRequirement) {
    setEditRowId(row.id)
    setEditType(row.type)
    setEditRequirement(row.requirement)
  }

  // ─────────────────────────────────────────────────────────
  // 4) Save an edited row
  // ─────────────────────────────────────────────────────────
  async function handleSaveEdit(id: number) {
    // Basic validation
    if (!editRequirement.trim()) {
      alert('Please enter a requirement description.')
      return
    }

    // Update in DB
    const { data, error } = await supabase
      .from('Pledge_Requirements')
      .update({
        type: editType,
        requirement: editRequirement,
      })
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      console.error('Error updating requirement:', error)
      return
    }

    // Update local state
    setRequirements(prev =>
      prev.map(row => (row.id === id ? (data as PledgeRequirement) : row))
    )
    // Clear edit mode
    setEditRowId(null)
    setEditType('pd')
    setEditRequirement('')
  }

  // ─────────────────────────────────────────────────────────
  // 5) Delete a row
  // ─────────────────────────────────────────────────────────
  async function handleDelete(id: number) {
    const confirmDelete = window.confirm('Are you sure you want to delete this row?')
    if (!confirmDelete) return

    const { error } = await supabase
      .from('Pledge_Requirements')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting requirement:', error)
      return
    }
    // Remove from local
    setRequirements(prev => prev.filter(row => row.id !== id))
  }

  // ─────────────────────────────────────────────────────────
  // Separate PD & Committee requirements
  // ─────────────────────────────────────────────────────────
  const pdRequirements = requirements.filter(r => r.type === 'pd')
  const committeeRequirements = requirements.filter(r => r.type === 'committee')

  // Helper to render a single item
  function renderRequirementItem(item: PledgeRequirement) {
    const isEditing = editRowId === item.id

    if (isEditing) {
      return (
        <li key={item.id} className="flex flex-col md:flex-row items-start md:items-center gap-2 mb-2">
          <select
            value={editType}
            onChange={e => setEditType(e.target.value as 'pd' | 'committee')}
            className="border p-1 rounded"
          >
            <option value="pd">PD</option>
            <option value="committee">Committee</option>
          </select>

          <input
            type="text"
            className="border p-1 rounded flex-1"
            value={editRequirement}
            onChange={e => setEditRequirement(e.target.value)}
          />

          <div className="flex gap-2">
            <button
              onClick={() => handleSaveEdit(item.id)}
              className="bg-red-800 hover:bg-red-900 text-white px-3 py-1 rounded"
            >
              Save
            </button>
            <button
              onClick={() => {
                setEditRowId(null)
                setEditRequirement('')
              }}
              className="bg-gray-400 hover:bg-gray-500 text-white px-3 py-1 rounded"
            >
              Cancel
            </button>
          </div>
        </li>
      )
    }

    // Not editing
    return (
      <li key={item.id} className="flex flex-col md:flex-row items-start md:items-center gap-2 mb-1">
        <span className="flex-1">{item.requirement}</span>

        <div className="flex gap-2">
          <button
            onClick={() => handleStartEdit(item)}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded"
          >
            Edit
          </button>
          <button
            onClick={() => handleDelete(item.id)}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
          >
            Delete
          </button>
        </div>
      </li>
    )
  }

  // ─────────────────────────────────────────────────────────
  // Rendering
  // ─────────────────────────────────────────────────────────
  return (
    <div className="bg-white p-4 rounded shadow mt-8">
      <h2 className="text-xl font-semibold text-[#8B0000] mb-4">
        Pledge Requirements Manager
      </h2>

      {/* ADD NEW Requirement */}
      <div className="flex flex-col md:flex-row items-center gap-2 mb-6">
        <select
          value={newType}
          onChange={e => setNewType(e.target.value as 'pd' | 'committee')}
          className="border p-1 rounded"
        >
          <option value="pd">PD</option>
          <option value="committee">Committee</option>
        </select>
        <input
          type="text"
          placeholder="Requirement text..."
          value={newRequirement}
          onChange={e => setNewRequirement(e.target.value)}
          className="border p-2 rounded flex-1"
        />
        <button
          onClick={handleAdd}
          className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
        >
          Add
        </button>
      </div>

      {/* PD Requirements */}
      <h3 className="text-lg font-semibold mb-2">PD Requirements</h3>
      {pdRequirements.length === 0 ? (
        <p className="text-gray-500 mb-4">No PD requirements found.</p>
      ) : (
        <ul className="mb-6">
          {pdRequirements.map(item => renderRequirementItem(item))}
        </ul>
      )}

      {/* Committee Requirements */}
      <h3 className="text-lg font-semibold mb-2">Committee Requirements</h3>
      {committeeRequirements.length === 0 ? (
        <p className="text-gray-500">No committee requirements found.</p>
      ) : (
        <ul>
          {committeeRequirements.map(item => renderRequirementItem(item))}
        </ul>
      )}
    </div>
  )
}
