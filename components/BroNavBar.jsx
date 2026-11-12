import React from 'react'
import Link from 'next/link';
import { useState, useEffect } from 'react';
import supabase from '@/supabase';
import { navItemsFor, resolveHref } from '@/utils/navItems';
import { uniqnameFromEmail } from '@/utils/roles';


let roleCache = null // module-level: survives client-side page navigation, reset on full reload

// isPledge is optional. When a page does not pass it, the role is detected from the signed-in user,
// so shared pages (member directory, interviews, family tree) show the right menu for brothers and PNMs.
/** @param {{ isPledge?: boolean }} props */
export default function BroNavBar({ isPledge: isPledgeProp }) {
  const [userEmail, setUserEmail] = useState();
  const [userid, setuserid] = useState();
  const [firstname, setFirstname] = useState();
  const [isAdmin, setIsAdmin] = useState(false);
  const [detected, setDetected] = useState(null); // null = not known yet, 'pledge' | 'brother'
  const getGreeting = () => {
    const currentTime = new Date().getHours();

    if (currentTime >= 5 && currentTime < 12) {
      return 'Good morning';
    } else if (currentTime >= 12 && currentTime < 18) {
      return 'Good afternoon';
    } else {
      return 'Good evening';
    }
  };

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const session = await supabase.auth.getSession();
        if (session) {
          setUserEmail(session.data.session?.user.email || '');
        }
      } catch (error) {
        console.log(error);
      }
    };

    fetchSession();
  }, []);

  useEffect(() => {
    if (!userEmail) return; // session not loaded yet: avoids email=eq.undefined queries
    let cancelled = false
    const apply = (r) => {
      if (cancelled) return
      setFirstname(r.firstname)
      setuserid(r.userid)
      setDetected(r.role)
      setIsAdmin(r.isAdmin)
    }

    // The sidebar remounts on every page. Reuse the result for the same user instead of re-querying each time.
    if (roleCache && roleCache.email === userEmail) {
      apply(roleCache)
      return () => { cancelled = true }
    }

    ;(async () => {
      // Only the columns we need, and 2 queries instead of 3.
      const [bro, pnm] = await Promise.all([
        supabase.from('Brothers').select('firstname, adminrole').eq('email', userEmail),
        supabase.from('Pledges').select('firstname').eq('email', userEmail),
      ])
      let result = null
      if (!bro.error && bro.data?.length === 1) {
        result = { role: 'brother', firstname: bro.data[0].firstname, isAdmin: Boolean(bro.data[0].adminrole) }
      } else if (!pnm.error && pnm.data?.length === 1) {
        result = { role: 'pledge', firstname: pnm.data[0].firstname, isAdmin: false }
      }
      if (!result) return
      result = { ...result, email: userEmail, userid: uniqnameFromEmail(userEmail) }
      roleCache = result
      apply(result)
    })()
    return () => { cancelled = true }
  }, [userEmail]);

  // A page can force a menu with the prop; otherwise wait until we know who is signed in (no brother-menu flash for PNMs).
  const isPledge = isPledgeProp ?? detected === 'pledge';
  const items = isPledgeProp === undefined && detected === null ? [] : navItemsFor({ isPledge, isAdmin });

  return (
    <div className="md:border-r-2 md:border-b-0 border-r-0 border-b-2 border-[#a3000020] flex-col justify-center items-center lg:w-1/4 flex-shrink-0">
      <div className="pt-4 pl-6 pr-6 pb-4">
        <p className="font-bold text-xl bg-[#8b000070] p-4 rounded-md text-center mb-4">{getGreeting()}, {firstname}!</p>

        <ul className="space-y-2 font-bold space-5">
          {items.map((item) => {
            const href = resolveHref(item, userid);
            // "My Profile" needs the uniqname; skip it until the session has loaded rather than link to /members/undefined.
            if (!userid && typeof item.href === 'function') return null;
            return (
              <li key={item.label}>
                <Link
                  href={href}
                  className="block hover:bg-[#8b000070] transition-colors duration-300 rounded py-4 pl-2"
                >
                  {item.label}
                  {item.badge && (
                    <span className="ml-2 align-top text-[10px] font-bold bg-red-600 text-white rounded px-1 py-0.5">{item.badge}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  )
}
