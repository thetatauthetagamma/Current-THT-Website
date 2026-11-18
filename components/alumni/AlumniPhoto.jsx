import React, { useState } from 'react'
import supabase from '@/supabase'
import { initialsOf } from '@/utils/alumni'

// Site photo from the "brothers" storage bucket (the same <uniqname>.jpeg the profile page uploads).
// The bucket is public, so this is a plain lazy-loaded <img>: the browser caches it and only fetches cards on screen.
// `version` is the file's updated_at, so a re-uploaded photo appears immediately. No version = no photo = initials.
export default function AlumniPhoto({ userid, firstname, lastname, version }) {
  const [failed, setFailed] = useState(false)

  if (version && userid && !failed) {
    const { data } = supabase.storage.from('brothers').getPublicUrl(`${userid}.jpeg`)
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`${data.publicUrl}?v=${encodeURIComponent(version)}`}
        alt={`${firstname ?? ''} ${lastname ?? ''}`.trim()}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        className="w-14 h-14 rounded-full object-cover flex-shrink-0 border border-gray-200"
      />
    )
  }
  return (
    <div
      aria-hidden="true"
      className="w-14 h-14 rounded-full flex-shrink-0 bg-[#8b000070] text-red-900 font-bold flex items-center justify-center"
    >
      {initialsOf(firstname, lastname)}
    </div>
  )
}
