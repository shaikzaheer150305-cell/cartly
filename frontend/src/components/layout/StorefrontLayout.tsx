import { Outlet } from 'react-router-dom'
import { Footer } from './Footer'
import { Navbar } from './Navbar'

export function StorefrontLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <Navbar />
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-7 sm:px-7 sm:py-9 lg:px-10">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
