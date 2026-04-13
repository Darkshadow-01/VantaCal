import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#f5f1e8] to-[#e8e4dc] dark:from-[#1a1a1a] dark:to-[#2b262c]">
      <div className="text-center space-y-6 p-8">
        <h1 className="text-5xl font-bold text-[#2b262c] dark:text-[#f5f1e8]">
          VanCal
        </h1>
        <p className="text-xl text-[#5a5550] dark:text-[#a8a4a0] max-w-md">
          Balance your life across Health, Work, and Relationships with our intelligent calendar system.
        </p>
        <div className="pt-4">
          <Link href="/calendar">
            <button className="px-8 py-3 bg-[#2b262c] text-[#f5f1e8] rounded-lg font-medium hover:opacity-90 transition-opacity">
              Get Started
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
