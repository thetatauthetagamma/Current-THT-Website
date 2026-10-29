import React, { useCallback, useEffect, useMemo, useState } from 'react'
import BroNavBar from '@/components/BroNavBar'
import AlumniCard from '@/components/alumni/AlumniCard'
import EditMyInfoModal from '@/components/alumni/EditMyInfoModal'
import supabase from '../../supabase'
import { classStatus, cleanText, gradYear, majorsOf, uniqueCaseInsensitive } from '@/utils/alumni'

/*
Brothers-only alumni directory (current brothers and alumni). Data comes from the
search_alumni() / alumni_filter_options() database functions, which enforce brothers-only
access with RLS. Only the name search runs in the database; everything else (major, company,
location, class year, Current/Alumni, sorting) runs here on cleaned-up values, because
Brothers.major / year / phone are free text. The full matching list is fetched in batches of 100
(the function's cap) and revealed 24 at a time with "Show more".
*/

const BATCH = 24
const FETCH_SIZE = 100

const SORTS = {
  recent: { label: 'Recently updated' },
  nameAsc: { label: 'Name (A–Z)' },
  nameDesc: { label: 'Name (Z–A)' },
  yearDesc: { label: 'Class year (newest first)' },
  yearAsc: { label: 'Class year (oldest first)' },
  company: { label: 'Company (A–Z)' }
}

const byName = (a, b) =>
  cleanText(a.lastname).localeCompare(cleanText(b.lastname)) ||
  cleanText(a.firstname).localeCompare(cleanText(b.firstname))

// Missing values always sort last, in either direction.
const byNumber = (get, dir) => (a, b) => {
  const x = get(a)
  const y = get(b)
  if (x === null && y === null) return byName(a, b)
  if (x === null) return 1
  if (y === null) return -1
  return (x - y) * dir || byName(a, b)
}

const SORT_FNS = {
  recent: null, // keep the database order (last_updated desc, then name)
  nameAsc: byName,
  nameDesc: (a, b) => byName(b, a),
  yearDesc: byNumber((p) => gradYear(p.year), -1),
  yearAsc: byNumber((p) => gradYear(p.year), 1),
  company: (a, b) => {
    const x = cleanText(a.company)
    const y = cleanText(b.company)
    if (!x && !y) return byName(a, b)
    if (!x) return 1
    if (!y) return -1
    return x.localeCompare(y) || byName(a, b)
  }
}

async function fetchAll(query) {
  const rows = []
  for (let offset = 0; ; offset += FETCH_SIZE) {
    const { data, error } = await supabase.rpc('search_alumni', {
      p_query: query,
      p_limit: FETCH_SIZE,
      p_offset: offset
    })
    if (error) throw error
    rows.push(...data)
    if (data.length < FETCH_SIZE) return rows
  }
}

export default function AlumniDirectory() {
  const [sessionChecked, setSessionChecked] = useState(false)
  const [me, setMe] = useState(null) // userid, or null when not a signed-in brother
  const [people, setPeople] = useState([])
  const [options, setOptions] = useState({ major: [], company: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [query, setQuery] = useState('')
  const [major, setMajor] = useState('')
  const [company, setCompany] = useState('')
  const [location, setLocation] = useState('')
  const [year, setYear] = useState('')
  const [status, setStatus] = useState('')
  const [hasCompany, setHasCompany] = useState(false)
  const [sort, setSort] = useState('company')
  const [shown, setShown] = useState(BATCH)
  const [editing, setEditing] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  // Who is signed in, and are they a brother?
  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.auth.getSession()
      const email = data.session?.user?.email
      if (email) {
        const userid = email.split('@')[0]
        const { data: rows } = await supabase.from('Brothers').select('userid').eq('userid', userid)
        if (rows?.length === 1) setMe(userid)
      }
      setSessionChecked(true)
    }
    check()
  }, [])

  // Filter dropdown values (standardized and de-duplicated)
  useEffect(() => {
    if (!me) return
    supabase.rpc('alumni_filter_options').then(({ data }) => {
      const by = (kind) => (data ?? []).filter((r) => r.kind === kind).map((r) => r.value)
      setOptions({
        major: uniqueCaseInsensitive(by('major').flatMap(majorsOf)),
        company: uniqueCaseInsensitive(by('company'))
      })
    })
  }, [me, reloadKey])

  // Name search (debounced); the rest is filtered locally
  useEffect(() => {
    if (!me) return
    let cancelled = false
    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const rows = await fetchAll(query)
        if (!cancelled) {
          setPeople(rows)
          setError('')
        }
      } catch (e) {
        console.error('Alumni search failed:', e)
        if (!cancelled) {
          const detail = process.env.NODE_ENV === 'development' && e?.message ? ` (${e.message})` : ''
          setError(`Could not load the directory. Please refresh and try again.${detail}`)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, 300)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [me, query, reloadKey])

  useEffect(() => setShown(BATCH), [query, major, company, location, year, status, hasCompany, sort])

  const years = useMemo(
    () => [...new Set(people.map((p) => gradYear(p.year)).filter(Boolean))].sort((a, b) => b - a),
    [people]
  )

  const filtered = useMemo(() => {
    const co = company.trim().toLowerCase()
    const loc = location.trim().toLowerCase()
    const rows = people.filter(
      (p) =>
        (!major || majorsOf(p.major).includes(major)) &&
        (!co || cleanText(p.company).toLowerCase().includes(co)) &&
        (!loc || cleanText(p.location).toLowerCase().includes(loc)) &&
        (!year || gradYear(p.year) === Number(year)) &&
        (!status || classStatus(p.year) === status) &&
        (!hasCompany || cleanText(p.company))
    )
    return SORT_FNS[sort] ? [...rows].sort(SORT_FNS[sort]) : rows
  }, [people, major, company, location, year, status, hasCompany, sort])

  const visible = filtered.slice(0, shown)
  const mine = people.find((p) => p.userid === me)
  const filtersActive = query || major || company || location || year || status || hasCompany

  const clearFilters = () => {
    setQuery('')
    setMajor('')
    setCompany('')
    setLocation('')
    setYear('')
    setStatus('')
    setHasCompany(false)
  }

  const onSaved = useCallback(() => {
    setEditing(false)
    setReloadKey((k) => k + 1)
  }, [])

  const control = 'p-2 border border-gray-300 rounded w-full bg-white'

  if (!sessionChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  if (!me) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="bg-white rounded shadow p-6 max-w-md text-center border-t-4 border-red-800">
          <h1 className="font-bold text-2xl mb-2">Brothers only</h1>
          <p className="text-gray-600">
            The alumni directory is only available to Theta Tau brothers. Sign in with your brother account to view it.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <BroNavBar isPledge={false} />

      <div className="flex-grow p-4 md:p-8 bg-gray-100 min-w-0">
        <div className="bg-white rounded shadow p-4 mb-6">
          <h1 className="font-bold text-2xl md:text-3xl mb-2">Alumni Directory</h1>
          <p className="text-gray-600">
            Find brothers, current and alumni, by name, major, company or location. Keep your own info up to date with
            &ldquo;Edit my info&rdquo; on your card.
          </p>
        </div>

        <div className="bg-white rounded shadow p-4 mb-6 grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="Search by name"
            aria-label="Search by name"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={`${control} md:col-span-3`}
          />
          <select value={major} onChange={(e) => setMajor(e.target.value)} className={control} aria-label="Major">
            <option value="">All majors</option>
            {options.major.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <div>
            <input
              type="text"
              list="alumni-companies"
              placeholder="Company"
              aria-label="Company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className={control}
            />
            <datalist id="alumni-companies">
              {options.company.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <input
            type="text"
            placeholder="Location (city or state)"
            aria-label="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className={control}
          />
          <select value={year} onChange={(e) => setYear(e.target.value)} className={control} aria-label="Class year">
            <option value="">All class years</option>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className={control} aria-label="Sort by">
            {Object.entries(SORTS).map(([key, { label }]) => (
              <option key={key} value={key}>Sort: {label}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm p-2">
            <input type="checkbox" checked={hasCompany} onChange={(e) => setHasCompany(e.target.checked)} />
            Only show brothers with a company listed
          </label>
          <div className="md:col-span-3 flex flex-wrap items-center gap-2">
            {[['', 'Everyone'], ['current', 'Current'], ['alumni', 'Alumni']].map(([value, label]) => (
              <button
                key={value}
                onClick={() => setStatus(value)}
                className={`px-3 py-1 rounded font-bold text-sm border ${
                  status === value
                    ? 'bg-red-800 text-white border-red-800'
                    : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-100'
                }`}
              >
                {label}
              </button>
            ))}
            {filtersActive && (
              <button onClick={clearFilters} className="ml-auto text-sm text-red-800 underline">
                Clear filters
              </button>
            )}
          </div>
        </div>

        {mine && !mine.company && !editing && (
          <div className="bg-red-50 border border-red-800 rounded p-3 mb-6 flex items-center justify-between gap-2">
            <p className="text-sm">Your company isn&apos;t listed yet. Add it so brothers can find you.</p>
            <button onClick={() => setEditing(true)} className="px-3 py-1 bg-red-800 text-white rounded font-bold text-sm">
              Add it
            </button>
          </div>
        )}

        {error && <p className="text-red-700 mb-4">{error}</p>}

        {loading ? (
          <p className="text-gray-600">Loading...</p>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded shadow p-4">
            <p className="text-gray-600">No brothers found matching your search.</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-600 mb-3">
              Showing {visible.length} of {filtered.length} {filtered.length === 1 ? 'brother' : 'brothers'}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {visible.map((p) => (
                <AlumniCard key={p.userid} person={p} isMe={p.userid === me} onEdit={() => setEditing(true)} />
              ))}
            </div>
            {visible.length < filtered.length && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={() => setShown((n) => n + BATCH)}
                  className="px-6 py-2 bg-red-800 text-white rounded font-bold hover:bg-red-700 transition-colors"
                >
                  Show {Math.min(BATCH, filtered.length - visible.length)} more
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {editing && (
        <EditMyInfoModal
          person={mine ?? {}}
          onClose={() => setEditing(false)}
          onSaved={onSaved}
        />
      )}
    </div>
  )
}
