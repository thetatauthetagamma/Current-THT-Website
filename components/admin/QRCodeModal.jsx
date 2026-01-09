import React, { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'

export default function QRCodeModal({ isOpen, onClose, eventId, eventName, attendanceKey }) {
  const [attendanceUrl, setAttendanceUrl] = useState('')

  useEffect(() => {
    if (isOpen && attendanceKey) {
      // Generate the full URL for the attendance page using attendance_key
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
      setAttendanceUrl(`${baseUrl}/attendance/${attendanceKey}`)
    } else if (isOpen && eventId) {
      // Fallback to eventId for backward compatibility (shouldn't happen with new events)
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
      setAttendanceUrl(`${baseUrl}/attendance/${eventId}`)
    }
  }, [isOpen, attendanceKey, eventId])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-[#8B0000]">QR Code for Attendance</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>
        
        {eventName && (
          <div className="mb-4">
            <div className="text-lg font-semibold text-gray-800">{eventName}</div>
          </div>
        )}

        <div className="flex flex-col items-center mb-4">
          {attendanceUrl ? (
            <div className="p-4 bg-white border-2 border-gray-200 rounded-lg">
              <QRCodeSVG
                value={attendanceUrl}
                size={256}
                level="H"
                includeMargin={true}
              />
            </div>
          ) : (
            <div className="w-64 h-64 bg-gray-200 rounded-lg flex items-center justify-center">
              <div className="text-gray-500">Loading QR code...</div>
            </div>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Attendance URL:
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={attendanceUrl}
              readOnly
              className="flex-1 border rounded p-2 text-sm bg-gray-50"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(attendanceUrl)
                alert('URL copied to clipboard!')
              }}
              className="bg-gray-500 text-white px-3 py-2 rounded hover:bg-gray-600 text-sm"
            >
              Copy
            </button>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Scan this QR code or share the URL to allow attendees to mark their attendance.
        </p>

        <button
          onClick={onClose}
          className="w-full bg-[#8B0000] text-white px-4 py-2 rounded hover:bg-red-800"
        >
          Close
        </button>
      </div>
    </div>
  )
}

