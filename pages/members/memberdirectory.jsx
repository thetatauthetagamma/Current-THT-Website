import React, { useEffect, useState } from 'react'
import BroNavBar from '@/components/BroNavBar'
import MemberTile from '@/components/MemberTile'
import supabase from '../../supabase'
import Cookies from 'js-cookie'

/*
This page displays a member directory. It displays the brothers in reverse roll order. 
To limit egress, only 10 members are shown at a time.
*/

export default function MemberDirectory() {
  const [brothers, setBrothers] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMajor, setSelectedMajor] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [isPledge, setIsPledge] = useState(true)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageLoading, setPageLoading] = useState(false)

  const brothersPerPage = 10

  useEffect(() => {
    setUserEmail(Cookies.get('userEmail'))

    const fetchData = async () => {
      try {
        // Fetch pledge data for user
        const [pledgeData, brothersData] = await Promise.all([
          supabase.from('Pledges').select('*').eq('email', userEmail),
          supabase.from('Brothers').select('*')
        ])

        // If user is found in Pledges, they are a pledge
        if (pledgeData.data?.length === 1 && !pledgeData.error) {
          setIsPledge(true)
        }

        // Handle potential errors
        if (brothersData.error) {
          throw brothersData.error
        }

        // Sort Brothers data by roll in descending order
        if (brothersData.data) {
          const sortedData = brothersData.data.sort((a, b) => b.roll - a.roll)
          setBrothers(sortedData)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    console.log("Fidget Fam == Best Fam")
  }, [userEmail])

  useEffect(() => {
    const checkIfBrother = async () => {
      const { data, error } = await supabase
        .from('Brothers')
        .select('*')
        .eq('email', userEmail)
      if (data?.length === 1 && !error) {
        setIsPledge(false)
      }
    }

    const checkIfPledge = async () => {
      const { data, error } = await supabase
        .from('Pledges')
        .select('*')
        .eq('email', userEmail)
      if (data?.length === 1 && !error) {
        setIsPledge(true)
      }
    }

    checkIfBrother()
    checkIfPledge()
  }, [userEmail])

  // Normalize phone strings for comparison
  function normalizePhone(brother) {
    return brother.phone?.replace(/[\(\s\-\)]/g, '')
  }

  // Strip out parentheses, spaces, hyphens to make phone search easier
  const normalizedSearchQuery = searchQuery.replace(/[\(\s\-\)]/g, '').toLowerCase()

  // Split the search into first name and last name (if present)
  const [searchFirstName, searchLastName] = searchQuery.toLowerCase().split(' ')

  // Filter brothers by name OR phone
  const filteredBrothers = brothers.filter((brother) => {
    const fname = brother.firstname.toLowerCase()
    const lname = brother.lastname.toLowerCase()

    // Name matches:
    const matchesName =
      (fname.startsWith(searchFirstName) &&
        (!searchLastName || lname.includes(searchLastName))) ||
      (!searchLastName && lname.startsWith(searchFirstName))

    // Phone matches:
    const matchesPhone = normalizePhone(brother)?.includes(normalizedSearchQuery)

    return matchesName || matchesPhone
  })

  // Filter by selected major if one is chosen
  const majorFilteredBrothers = selectedMajor
    ? filteredBrothers.filter((brother) => {
      if (brother.major) {
        const normalizedMajor = brother.major.toLowerCase()
        const normalizedSelectedMajor = selectedMajor.toLowerCase()

        // Special check for exact matches "CE"/"CEE" or "EE"/"CEE"
        if (normalizedSelectedMajor === 'ce' && normalizedMajor === 'ce') {
          return true
        } else if (normalizedSelectedMajor === 'ce' && normalizedMajor === 'cee') {
          return false
        }
        if (normalizedSelectedMajor === 'ee' && normalizedMajor === 'ee') {
          return true
        } else if (normalizedSelectedMajor === 'ee' && normalizedMajor === 'cee') {
          return false
        }
        return normalizedMajor.includes(normalizedSelectedMajor)
      }
      return false
    })
    : filteredBrothers

  // Pagination calculations
  const totalPages = Math.ceil(majorFilteredBrothers.length / brothersPerPage)
  const indexOfLastBrother = currentPage * brothersPerPage
  const indexOfFirstBrother = indexOfLastBrother - brothersPerPage
  const currentBrothers = majorFilteredBrothers.slice(indexOfFirstBrother, indexOfLastBrother)

  // Reset to first page if search or major changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedMajor])

  const handleNextPage = async () => {
    if (pageLoading || currentPage === totalPages || totalPages === 0) return

    setPageLoading(true)
    setCurrentPage((prev) => Math.min(prev + 1, totalPages))

    await new Promise((resolve) => setTimeout(resolve, 100))

    setPageLoading(false)
  }
  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1))
  }

  const majors = [
    'Mech E',
    'CS',
    'CE',
    'EE',
    'CEE',
    'Chem E',
    'Aero',
    'Math',
    'IOE',
    'NAME',
    'MSE',
    'NERS',
    'Rob',
    'BME'
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen ">
      {/* Left Nav */}
      {isPledge ? <BroNavBar isPledge /> : <BroNavBar isPledge={false} />}

      {/* Main Content */}
      <div className="flex-grow p-4 md:p-8 bg-gray-100">
        {/* Header Card */}
        <div className="bg-white rounded shadow p-4 mb-6">
          <h1 className="font-bold text-2xl md:text-3xl mb-2">Our Brothers</h1>
          <p className="text-gray-600">
            Browse through our directory of brothers. Use the search bar and major filter
            to narrow down your search.
          </p>
        </div>

        {/* Search & Filter Card */}
        <div className="bg-white rounded shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:space-x-4">
            {/* Search Input */}
            <input
              type="text"
              placeholder="Search by name or phone number"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 mb-4 md:mb-0 p-2 border border-gray-300 rounded"
            />
            {/* Major Dropdown */}
            <select
              value={selectedMajor}
              onChange={(e) => setSelectedMajor(e.target.value)}
              className="p-2 border border-gray-300 rounded w-full md:w-1/3"
            >
              <option value="">All Majors</option>
              {majors.map((major) => (
                <option key={major} value={major}>
                  {major}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Directory List Card */}
        <div className="bg-white rounded shadow p-4">
          {/* If no results found */}
          {currentBrothers.length === 0 && (
            <p className="text-gray-600">No members found matching your criteria.</p>
          )}

          {/* Brothers List (scrollable) */}
          <div className="max-h-[550px] overflow-y-auto divide-y divide-gray-200">
            {currentBrothers.map((brother) => (
              <div
                key={brother.userid}
                className="py-4 px-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <MemberTile
                  userid={brother.userid}
                  firstname={brother.firstname}
                  lastname={brother.lastname}
                  year={brother.year}
                  major={brother.major}
                  roll={brother.roll}
                  linkedin={brother.linkedin}
                  email={brother.email}
                  phone={brother.phone}
                />
              </div>
            ))}
          </div>

          {/* Pagination */}
          {majorFilteredBrothers.length > 0 && (
            <div className="flex justify-between items-center mt-4">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
              >
                &larr; Previous
              </button>
              <p>
                Page {currentPage} of {totalPages || 1}
              </p>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
              >
                Next &rarr;
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
