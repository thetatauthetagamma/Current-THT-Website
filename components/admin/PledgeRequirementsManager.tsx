import { useState, useEffect } from 'react'
import supabase from '@/supabase'

// Simple types for a row in Pledge_Requirements_Update
interface PledgeRequirement {
  id: number
  type: 'PD' | 'COMMITTEE'
  requirement: string
}

interface PledgeRequirementsManagerProps {
  adminRole?: string
}

export default function PledgeRequirementsManager({ adminRole }: PledgeRequirementsManagerProps) {
  // State to hold all rows from the DB
  const [requirements, setRequirements] = useState<PledgeRequirement[]>([])

  // Track whether we are showing the editor
  const [showEditor, setShowEditor] = useState(false)

  // State for new row inputs
  const [newType, setNewType] = useState<'PD' | 'COMMITTEE'>('PD')
  const [newRequirement, setNewRequirement] = useState('')

  // For editing an existing row inline
  const [editRowId, setEditRowId] = useState<number | null>(null)
  const [editType, setEditType] = useState<'PD' | 'COMMITTEE'>('PD')
  const [editRequirement, setEditRequirement] = useState('')

  // ─────────────────────────────────────────────────────────
  // 1) Fetch all existing requirements
  // ─────────────────────────────────────────────────────────
  const fetchRequirements = async () => {
    const { data, error } = await supabase
      .from('Pledge_Requirements_Update')
      .select('*')
      .order('id', { ascending: true })
    if (error) {
      console.error('Error fetching Pledge_Requirements_Update:', error)
    } else if (data) {
      setRequirements(data as PledgeRequirement[])
    }
  }

  // Fetch on mount
  useEffect(() => {
    fetchRequirements()
  }, [])

  // Refresh when editor opens to ensure we have latest data
  useEffect(() => {
    if (showEditor) {
      fetchRequirements()
    }
  }, [showEditor])

  // ─────────────────────────────────────────────────────────
  // Helper: Calculate minimum available ID (> 0)
  // ─────────────────────────────────────────────────────────
  function getMinimumAvailableId(): number {
    if (requirements.length === 0) {
      return 1
    }

    // Get all existing IDs as numbers, sorted
    const existingIds = requirements
      .map(r => Number(r.id))
      .filter(id => Number.isFinite(id) && id > 0)
      .sort((a, b) => a - b)

    // Find the first gap starting from 1
    let candidate = 1
    for (const id of existingIds) {
      if (candidate < id) {
        // Found a gap
        return candidate
      }
      candidate = id + 1
    }

    // No gap found, return the next ID after the highest
    return candidate
  }

  // ─────────────────────────────────────────────────────────
  // 2) Add a new requirement
  // ─────────────────────────────────────────────────────────
  async function handleAdd() {
    // Basic validation
    if (!newRequirement.trim()) {
      alert('Please enter a requirement description.')
      return
    }

    // Calculate the minimum available ID
    const newId = getMinimumAvailableId()

    // Insert row with the calculated ID
    const { data, error } = await supabase
      .from('Pledge_Requirements_Update')
      .insert([{ id: newId, type: newType, requirement: newRequirement }])
      .select('*')
      .single()

    if (error) {
      console.error('Error inserting requirement:', error)
      alert(`Error adding requirement: ${error.message}`)
      return
    }

    // If successful, push the new row into local state
    if (data) {
      setRequirements(prev => [...prev, data as PledgeRequirement].sort((a, b) => a.id - b.id))
      alert(`Added ${newType} requirement with ID ${newId}`)
    }
    // Reset inputs
    setNewRequirement('')
    setNewType('PD')
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
      .from('Pledge_Requirements_Update')
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
    setEditType('PD')
    setEditRequirement('')
  }

  // ─────────────────────────────────────────────────────────
  // 5) Delete a row
  // ─────────────────────────────────────────────────────────
  async function handleDelete(id: number) {
    const requirement = requirements.find(r => r.id === id)
    const reqText = requirement ? `${requirement.type}: ${requirement.requirement}` : `ID ${id}`
    const confirmDelete = window.confirm(`Are you sure you want to delete this requirement?\n\n${reqText}`)
    if (!confirmDelete) return

    const { error } = await supabase
      .from('Pledge_Requirements_Update')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting requirement:', error)
      alert(`Error deleting requirement: ${error.message}`)
      return
    }
    // Remove from local
    setRequirements(prev => prev.filter(row => row.id !== id))
    alert(`Deleted requirement: ${reqText}`)
  }

  // Separate PD & Committee requirements for easy display
  const pdRequirements = requirements.filter(r => r.type === 'PD')
  const committeeRequirements = requirements.filter(r => r.type === 'COMMITTEE')

  // Helper to render a single item
  function renderRequirementItem(item: PledgeRequirement) {
    const isEditing = editRowId === item.id

    if (isEditing) {
      return (
        <li
          key={item.id}
          className="flex flex-col md:flex-row items-start md:items-center gap-2 mb-2"
        >
          <select
            value={editType}
            onChange={e => setEditType(e.target.value as 'PD' | 'COMMITTEE')}
            className="border p-1 rounded"
          >
            <option value="PD">PD</option>
            <option value="COMMITTEE">COMMITTEE</option>
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
      <li
        key={item.id}
        className="flex flex-col md:flex-row items-start md:items-center gap-2 mb-2 p-2 border border-gray-200 rounded hover:bg-gray-50"
      >
        <div className="flex-1">
          <span className="font-semibold text-[#8B0000]">ID {item.id}</span>
          <span className="ml-2 text-xs bg-gray-200 px-2 py-1 rounded">{item.type}</span>
          <span className="ml-2">{item.requirement}</span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => handleStartEdit(item)}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded font-medium"
          >
            Edit
          </button>
          <button
            onClick={() => handleDelete(item.id)}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded font-medium"
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

  // Only show to dev role
  if (adminRole !== 'dev') {
    return null
  }

  // If not in editing mode, just show a button
  if (!showEditor) {
    return (
      <div className="mt-8">
        <button
          onClick={() => setShowEditor(true)}
          className="bg-red-800 hover:bg-red-900 text-white px-4 py-2 rounded"
        >
          Manage PD/Committee Signoffs
        </button>
      </div>
    )
  }

  // Otherwise, show the entire editor
  return (
    <div className="bg-white p-4 rounded shadow mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-[#8B0000]">
          Committee/PD Requirements Editor
        </h2>
        <button
          onClick={() => setShowEditor(false)}
          className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded"
        >
          Close Editor
        </button>
      </div>

      {/* ADD NEW Requirement */}
      <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 mb-6">
        <h3 className="text-lg font-semibold mb-3 text-[#8B0000]">Add New Signoff</h3>
        <div className="flex flex-col md:flex-row items-center gap-2">
          <select
            value={newType}
            onChange={e => setNewType(e.target.value as 'PD' | 'COMMITTEE')}
            className="border p-2 rounded font-medium"
          >
            <option value="PD">PD</option>
            <option value="COMMITTEE">COMMITTEE</option>
          </select>
          <input
            type="text"
            placeholder="Enter requirement description..."
            value={newRequirement}
            onChange={e => setNewRequirement(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleAdd()}
            className="border p-2 rounded flex-1"
          />
          <button
            onClick={handleAdd}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 font-bold"
          >
            Add Signoff
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          New signoff will be assigned the minimum available ID (starting from 1)
        </p>
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
