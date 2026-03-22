"use client";

import { VanCal } from "@/components/Calendar";
import { CalendarIcon, Zap, Clock, Shield, Sparkles, ArrowRight, CheckCircle } from "lucide-react";

export default function VanCalPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-purple-900">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b dark:bg-gray-800/80">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <CalendarIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                VanCal
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">AI-Powered Calendar</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="#features"
              className="text-gray-600 dark:text-gray-300 hover:text-blue-600"
            >
              Features
            </a>
            <a
              href="#demo"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Demo
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-700 dark:text-blue-300 text-sm font-medium mb-6">
          <Sparkles className="w-4 h-4" />
          <span>AI-Powered Scheduling</span>
        </div>
        
        <h2 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
          Think ahead.<br />
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Stay in flow.
          </span>
        </h2>
        
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
          VanCal combines intelligent scheduling with predictive AI, helping you manage your time across Health, Work, and Relationships systems.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="#demo"
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
          >
            Try VanCal Now
            <ArrowRight className="w-5 h-5" />
          </a>
          <button className="flex items-center gap-2 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:border-blue-500 hover:text-blue-600 transition-colors">
            Watch Demo Video
          </button>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="max-w-7xl mx-auto px-4 py-20">
        <h3 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
          Powerful Features
        </h3>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-4">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Predictive Buffers
            </h4>
            <p className="text-gray-600 dark:text-gray-400">
              AI automatically calculates buffer time between events to prevent rushing and reduce stress.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Smart Insights
            </h4>
            <p className="text-gray-600 dark:text-gray-400">
              Get personalized recommendations to optimize your schedule and maintain system balance.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Natural Language
            </h4>
            <p className="text-gray-600 dark:text-gray-400">
              Just type "Gym tomorrow at 7am" and VanCal creates the event for you.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Recurring Events
            </h4>
            <p className="text-gray-600 dark:text-gray-400">
              Set up daily, weekly, or custom recurrence patterns with smart occurrence expansion.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Smart Reminders
            </h4>
            <p className="text-gray-600 dark:text-gray-400">
              Browser notifications and custom reminder times keep you on track without the noise.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center mb-4">
              <CalendarIcon className="w-6 h-6 text-white" />
            </div>
            <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Multiple Views
            </h4>
            <p className="text-gray-600 dark:text-gray-400">
              Daily, weekly, monthly, and yearly views give you the perfect perspective.
            </p>
          </div>
        </div>
      </section>

      {/* System Colors */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <h3 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
          Organize Your Life Systems
        </h3>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-4xl">💪</span>
            </div>
            <h4 className="text-xl font-semibold text-green-600 dark:text-green-400 mb-2">
              Health
            </h4>
            <p className="text-gray-600 dark:text-gray-400">
              Exercise, sleep, nutrition, and self-care
            </p>
          </div>

          <div className="text-center">
            <div className="w-20 h-20 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-4xl">💼</span>
            </div>
            <h4 className="text-xl font-semibold text-blue-600 dark:text-blue-400 mb-2">
              Work
            </h4>
            <p className="text-gray-600 dark:text-gray-400">
              Meetings, deadlines, and projects
            </p>
          </div>

          <div className="text-center">
            <div className="w-20 h-20 bg-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-4xl">❤️</span>
            </div>
            <h4 className="text-xl font-semibold text-purple-600 dark:text-purple-400 mb-2">
              Relationships
            </h4>
            <p className="text-gray-600 dark:text-gray-400">
              Family, friends, and social connections
            </p>
          </div>
        </div>
      </section>

      {/* Live Demo */}
      <section id="demo" className="max-w-7xl mx-auto px-4 py-20">
        <h3 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-8">
          Try VanCal Live
        </h3>
        
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
          <VanCal />
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-white">
          <h3 className="text-3xl font-bold mb-4">
            Ready to Transform Your Scheduling?
          </h3>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Join the future of intelligent calendar management with VanCal.
          </p>
          <a
            href="#demo"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-xl font-medium hover:shadow-lg transition-all"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <CalendarIcon className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              VanCal
            </span>
          </div>
          <p className="text-center text-gray-500 dark:text-gray-400 text-sm">
            © 2026 VanCal. AI-Powered Calendar. Think ahead. Stay in flow.
          </p>
        </div>
      </footer>
    </div>
  );
}
