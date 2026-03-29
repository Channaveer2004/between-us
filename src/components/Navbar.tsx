"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { PenSquare, LogOut, User as UserIcon, Search, Menu, X, Home } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

export default function Navbar() {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="border-b border-gray-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Left Side: Hamburger & Logo */}
          <div className="flex items-center">
            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="mr-2 sm:hidden p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 focus:outline-none"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            <Link href="/" className="font-serif font-bold text-2xl tracking-tight text-slate-800 dark:text-slate-100 mr-4 sm:mr-8" onClick={() => setIsMobileMenuOpen(false)}>
              between-us.
            </Link>
            
            {/* Desktop Search */}
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

          {/* Right Side: ThemeToggle & Desktop Actions */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <ThemeToggle />
            
            {/* Desktop unauthenticated */}
            {!isLoading && !session && (
              <div className="hidden sm:flex items-center space-x-4">
                <Link href="/login" className="text-sm font-medium text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200">
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="bg-sky-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-sky-500 transition"
                >
                  Get started
                </Link>
              </div>
            )}

            {/* Desktop authenticated */}
            {!isLoading && session && (
              <div className="hidden sm:flex items-center space-x-4">
                <Link
                  href="/write"
                  className="flex items-center text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 text-sm font-medium"
                >
                  <PenSquare className="h-5 w-5 mr-1" strokeWidth={1.5} />
                  Write
                </Link>

                <div className="relative ml-2">
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
              </div>
            )}
            
            {/* Mobile User Avatar trigger (only if authenticated) */}
            {!isLoading && session && (
              <Link href="/profile" className="sm:hidden h-8 w-8 rounded-full bg-gray-200 dark:bg-slate-800 flex items-center justify-center border border-gray-300 dark:border-slate-700 ml-2">
                <UserIcon className="h-5 w-5 text-gray-500 dark:text-slate-400" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Slide-down Menu */}
      {isMobileMenuOpen && (
        <div className="sm:hidden bg-white dark:bg-slate-950 border-t border-gray-100 dark:border-slate-800 shadow-xl overflow-y-auto max-h-[80vh]">
          <div className="px-4 py-4 space-y-4">
            {/* Mobile Search */}
            <form action="/search" className="flex items-center bg-gray-50 dark:bg-slate-900 rounded-full px-4 py-2 border border-gray-100 dark:border-slate-800">
              <Search className="h-4 w-4 text-gray-400 dark:text-slate-500 mr-2 shrink-0" />
              <input
                name="q"
                type="text"
                placeholder="Search stories..."
                className="bg-transparent border-none focus:outline-none text-sm w-full text-slate-900 dark:text-slate-100 placeholder:-gray-400 dark:placeholder-slate-500"
              />
            </form>

            <div className="flex flex-col space-y-1">
              <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center px-3 py-3 rounded-md text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-900 transition">
                <Home className="h-5 w-5 mr-3 text-slate-400" />
                Home
              </Link>
              
              {!isLoading && !session && (
                <>
                  <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center px-3 py-3 rounded-md text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-900 transition">
                    <UserIcon className="h-5 w-5 mr-3 text-slate-400" />
                    Sign in
                  </Link>
                  <Link href="/register" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center px-3 py-3 rounded-md text-base font-medium text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/20 transition mt-2">
                    Get started
                  </Link>
                </>
              )}

              {!isLoading && session && (
                <>
                  <Link href="/write" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center px-3 py-3 rounded-md text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-900 transition mt-2">
                    <PenSquare className="h-5 w-5 mr-3 text-slate-400" />
                    Write a story
                  </Link>
                  <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center px-3 py-3 rounded-md text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-900 transition">
                    <UserIcon className="h-5 w-5 mr-3 text-slate-400" />
                    Your Profile
                  </Link>
                  <div className="border-t border-gray-100 dark:border-slate-800 my-2 pt-2">
                    <button onClick={() => { setIsMobileMenuOpen(false); signOut(); }} className="flex w-full items-center px-3 py-3 rounded-md text-base font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition">
                      <LogOut className="h-5 w-5 mr-3 text-red-400" />
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
