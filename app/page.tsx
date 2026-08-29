import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-cncp-blue-dark/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2.5 group">
              <Image
                src="/cncp-fb-logo.jpg"
                alt="CNCP Logo"
                width={36}
                height={36}
                className="w-9 h-9 rounded-lg object-cover transition-transform duration-200 group-hover:rotate-[-4deg]"
              />
              <span className="text-white font-semibold text-[1.05rem] tracking-tight hidden sm:block">
                CNCP Scheduler
              </span>
            </Link>

            <div className="flex items-center gap-2">
              <Link
                href="/signin"
                className="text-white/70 hover:text-white px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 hover:bg-white/5"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="cncp-btn-primary !w-auto !px-5 !py-2 !text-sm !rounded-lg"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-16 min-h-screen flex items-center">
        <div className="bg-cncp-hero absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-br from-cncp-blue-dark/90 via-cncp-blue/80 to-cncp-blue-dark/85" />

        {/* Decorative elements */}
        <div className="absolute top-32 right-12 w-72 h-72 bg-cncp-yellow/8 rounded-full blur-3xl anim-fade-in delay-3" />
        <div className="absolute bottom-20 left-8 w-96 h-96 bg-cncp-blue-light/10 rounded-full blur-3xl anim-fade-in delay-5" />

        <div className="relative max-w-7xl mx-auto px-5 sm:px-8 w-full">
          <div className="max-w-2xl">
            <h1 className="text-[2.75rem] sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] tracking-tight anim-fade-in-up delay-2">
              Your next interview
              <br />
              starts with a{" "}
              <span className="relative inline-block">
                <span className="text-cncp-yellow">click</span>
                <svg
                  className="absolute -bottom-1 left-0 w-full"
                  viewBox="0 0 120 8"
                  fill="none"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M2 6C30 2 60 2 118 4"
                    stroke="#f0c040"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    opacity="0.5"
                  />
                </svg>
              </span>
            </h1>

            <p className="mt-6 text-lg text-white/65 max-w-lg leading-relaxed anim-fade-in-up delay-3">
              Book your interview or meeting slot with CNCP. Pick an available
              date, choose a time, and you&apos;re set. No emails, no waiting.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-3 anim-fade-in-up delay-4">
              <Link
                href="/signup"
                className="cncp-btn-primary !w-auto !px-8 !py-3.5 !text-base !rounded-xl"
              >
                Book a Schedule
                <svg
                  className="w-4 h-4 ml-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </Link>
              <Link
                href="/signin"
                className="cncp-btn-secondary !w-auto !px-8 !py-3.5 !text-base !rounded-xl !border-white/20 !text-white hover:!bg-white/10 hover:!border-white/30"
              >
                I already have an account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-cncp-blue-dark border-t border-white/5">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-10">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <Image
                  src="/cncp-fb-logo.jpg"
                  alt="CNCP Logo"
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-lg object-cover"
                />
                <span className="text-white font-semibold text-sm">
                  CNCP Scheduler
                </span>
              </div>
              <p className="text-white/35 text-sm leading-relaxed max-w-xs">
                Interview and meeting scheduling platform for Cisco NetConnect
                PUP — Manila.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-4">
                Quick Links
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <Link
                    href="/schedule"
                    className="text-white/40 text-sm hover:text-cncp-yellow transition-colors duration-200"
                  >
                    Book a Schedule
                  </Link>
                </li>
                <li>
                  <Link
                    href="/signin"
                    className="text-white/40 text-sm hover:text-cncp-yellow transition-colors duration-200"
                  >
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link
                    href="/signup"
                    className="text-white/40 text-sm hover:text-cncp-yellow transition-colors duration-200"
                  >
                    Create Account
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-4">
                Contact
              </h4>
              <ul className="space-y-2.5">
                <li className="text-white/40 text-sm">
                  Polytechnic University of the Philippines
                </li>
                <li className="text-white/40 text-sm">
                  Manila, Philippines
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-white/25 text-xs">
              &copy; {new Date().getFullYear()} CNCP Scheduler. All rights
              reserved.
            </p>
            <p className="text-white/20 text-xs">
              Cisco NetConnect PUP — Manila
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
