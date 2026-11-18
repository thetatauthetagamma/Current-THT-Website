import React from 'react'
import AlumniPhoto from '@/components/alumni/AlumniPhoto'
import { classStatus, cleanText, formatPhone, gradYear, majorsOf, safeLinkedInUrl } from '@/utils/alumni'

const PHONE_SHOWN_AFTER_YEAR = 2024

const STATUS_STYLES = {
  current: 'bg-green-100 text-green-800',
  alumni: 'bg-gray-200 text-gray-800'
}

export default function AlumniCard({ person, isMe, onEdit, photoVersion }) {
  const year = gradYear(person.year)
  const status = classStatus(person.year)
  const linkedin = safeLinkedInUrl(person.linkedin)
  const company = cleanText(person.company)
  const title = cleanText(person.title)
  const location = cleanText(person.location)
  const majors = majorsOf(person.major).join(', ')
  const phone = formatPhone(person.phone)
  const hasJob = company || title
  // Same rule as the member directory (MemberTile): phone numbers show for class years after 2024 only.
  const showPhone = phone.display && year > PHONE_SHOWN_AFTER_YEAR
  const updated = person.last_updated
    ? new Date(person.last_updated).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
    : null

  return (
    <div className="bg-white rounded shadow p-4 flex flex-col border-t-4 border-red-800">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <AlumniPhoto userid={person.userid} firstname={person.firstname} lastname={person.lastname} version={photoVersion} />
          <div>
            <h2 className="font-bold text-xl leading-tight">
              {person.firstname} {person.lastname}
            </h2>
            <p className="text-gray-600 text-sm">
              {[majors, year && `Class of ${year}`].filter(Boolean).join(' · ') || 'No major or year listed'}
            </p>
          </div>
        </div>
        {STATUS_STYLES[status] && (
          <span className={`text-xs font-bold px-2 py-1 rounded ${STATUS_STYLES[status]}`}>
            {status === 'current' ? 'Current' : 'Alumni'}
          </span>
        )}
      </div>

      <div className="mt-3 flex-grow">
        {hasJob ? (
          <>
            <p className="font-bold">{company || title}</p>
            {company && title && <p className="text-gray-700">{title}</p>}
            {title && person.title_fresh === false && (
              <p className="text-xs text-gray-500">title may be out of date</p>
            )}
          </>
        ) : (
          <p className="text-gray-500 italic">
            {isMe ? 'Add your current company so brothers can find you.' : 'No company listed yet.'}
          </p>
        )}
        {location && <p className="text-gray-600 text-sm mt-1">{location}</p>}
      </div>

      <div className="mt-4 text-sm space-y-1">
        {person.email && (
          <p className="break-all">
            <a href={`mailto:${person.email}`} className="text-gray-800 hover:text-red-800">
              {person.email}
            </a>
          </p>
        )}
        {showPhone && (
          <p>
            <a href={`tel:${phone.tel}`} className="text-gray-800 hover:text-red-800">
              {phone.display}
            </a>
          </p>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2 items-center">
        {linkedin && (
          <a
            href={linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-1 bg-[#0A66C2] text-white rounded font-bold text-sm hover:bg-[#004182] transition-colors"
          >
            <span className="bg-white text-[#0A66C2] rounded-sm px-1 text-xs leading-none py-0.5 font-bold">in</span>
            LinkedIn
          </a>
        )}
        {isMe && (
          <button
            onClick={onEdit}
            className="px-3 py-1 border border-red-800 text-red-800 rounded font-bold text-sm hover:bg-red-50 transition-colors"
          >
            Edit my info
          </button>
        )}
      </div>

      {updated && <p className="text-xs text-gray-400 mt-2">Updated {updated}</p>}
    </div>
  )
}
