"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { PenSquare, LogOut, User as UserIcon, Search } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

export default function Navbar() {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <nav className="border-b border-gray-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link href="/" className="font-serif font-bold text-2xl tracking-tight text-slate-800 dark:text-slate-100 mr-4 sm:mr-8">
              between-us.
            </Link>
            <form action="/search" className="hidden sm:flex items-center bg-gray-50 dark:bg-slate-900 rounded-full px-4 py-2 border border-gray-100 dark:border-slate-800 focus-within:border-gray-300 dark:focus-within:border-slate-600 transition">
              <Search className="h-4 w-4 text-gray-400 dark:text-slate-500 mr-2 shrink-0" />
              <input
                name="q"
                type="text"
                placeholder="Search"
                className="bg-transparent border-none focus:outline-none text-sm w-32 md:w-48 text-slate-900 dark:text-slate-100 placeholder:-gray-400 dark:placeholder-slate-500"
              />
            </form>
          </div>

          <div className="flex items-center space-x-4">
            <ThemeToggle />
            {!isLoading && !session && (
              <>
                <Link href="/login" className="text-sm font-medium text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 hidden sm:block">
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="bg-sky-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-sky-500 transition"
                >
                  Get started
                </Link>
              </>
            )}

            {!isLoading && session && (
              <>
                <Link
                  href="/write"
                  className="hidden sm:flex items-center text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 text-sm font-medium"
                >
                  <PenSquare className="h-5 w-5 mr-1" strokeWidth={1.5} />
                  Write
                </Link>

                <div className="relative ml-4">
                  <button 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="h-8 w-8 rounded-full bg-gray-200 dark:bg-slate-800 flex items-center justify-center border border-gray-300 dark:border-slate-700 focus:outline-none cursor-pointer"
                  >
                    <UserIcon className="h-5 w-5 text-gray-500 dark:text-slate-400" />
                  </button>
                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-900 rounded-md shadow-lg py-1 border border-gray-100 dark:border-slate-800 z-50">
                      <div className="px-4 py-2 border-b border-gray-100 dark:border-slate-800">
                        <p className="text-sm text-gray-900 dark:text-slate-200 truncate">{session.user?.name}</p>
                        <p className="text-xs text-gray-500 dark:text-slate-500 truncate">{session.user?.email}</p>
                      </div>
                      <Link 
                        href="/profile" 
                        onClick={() => setIsDropdownOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                      >
                        Profile
                      </Link>
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          signOut();
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
