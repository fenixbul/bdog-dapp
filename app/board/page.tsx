'use client';

import React from 'react';
import { Button } from "@/components/ui";
import { 
  CheckSquare,
  TrendingUp,
  MessageSquare,
  Zap,
  ArrowRight,
  Sparkles,
  Users,
  Target,
  BarChart3,
  ExternalLink
} from "lucide-react";

export default function BoardDashboard() {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-black text-white min-h-screen">
      {/* Hero Section - BDOG Board */}
      <section className="min-h-screen flex items-center justify-center relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-[#00ff9e] rounded-full animate-pulse"></div>
          <div className="absolute top-3/4 right-1/4 w-2 h-2 bg-[#00ff9e] rounded-full animate-pulse delay-1000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-2.5 h-2.5 bg-[#00ff9e] rounded-full animate-pulse delay-500"></div>
          <div className="absolute top-1/2 right-1/3 w-1.5 h-1.5 bg-[#00ff9e] rounded-full animate-pulse delay-700"></div>
        </div>
        
        <div className="text-center z-10 max-w-5xl mx-auto px-6">
          {/* Brand Icon */}
          <div className="relative mb-12">
            <div className="inline-flex items-center justify-center w-28 h-28 bg-gradient-to-br from-[#00ff9e] to-[#00cc7a] rounded-full mb-8 animate-pulse">
              <BarChart3 className="w-14 h-14 text-black" />
            </div>
            <Sparkles className="absolute -top-3 -right-3 w-10 h-10 text-[#00ff9e] animate-bounce" />
          </div>
          
          {/* 7-Second Hook */}
          <h1 className="text-6xl md:text-8xl font-bold mb-8 bg-gradient-to-r from-[#00ff9e] to-[#00cc7a] bg-clip-text text-transparent leading-tight">
            BDOG Board
          </h1>
          
          {/* Power Message */}
          <p className="text-3xl md:text-5xl font-bold text-white mb-16 leading-tight">
            The place where the pack builds, tracks, and moves.
          </p>
          
          {/* Direct CTA */}
          <div className="mb-16">
            <Button 
              variant="primary" 
              className="px-12 py-6 text-xl font-bold"
              onClick={() => scrollToSection('why-board')}
            >
              See Why We Built This
              <ArrowRight className="w-6 h-6 ml-3" />
            </Button>
          </div>
          
          {/* Scroll indicator */}
          <div className="animate-bounce">
            <div className="w-8 h-12 border-2 border-[#00ff9e] rounded-full flex justify-center mx-auto">
              <div className="w-1.5 h-4 bg-[#00ff9e] rounded-full mt-2 animate-pulse"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Why This Board Exists */}
      <section id="why-board" className="py-24 px-6 bg-gradient-to-b from-black to-gray-950">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold mb-12 text-[#00ff9e]">
              Why This Board Exists
            </h2>
          </div>
          
          {/* Four Core Reasons */}
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <div className="text-center bg-gray-900 p-8 rounded-lg border border-[#00ff9e]">
              <p className="text-2xl font-bold text-white">
                To keep holders aligned
              </p>
            </div>
            
            <div className="text-center bg-gray-900 p-8 rounded-lg border border-[#00ff9e]">
              <p className="text-2xl font-bold text-white">
                To show what BDOG is doing in real time
              </p>
            </div>
            
            <div className="text-center bg-gray-900 p-8 rounded-lg border border-[#00ff9e]">
              <p className="text-2xl font-bold text-white">
                To give every investor a voice
              </p>
            </div>
            
            <div className="text-center bg-gray-900 p-8 rounded-lg border border-[#00ff9e]">
              <p className="text-2xl font-bold text-white">
                To keep momentum alive through transparency and action
              </p>
            </div>
          </div>
          
          {/* Transition */}
          <div className="text-center">
            <Button 
              variant="primary" 
              className="px-12 py-6 text-xl font-bold"
              onClick={() => scrollToSection('what-you-get')}
            >
              See What You Get
              <ArrowRight className="w-6 h-6 ml-3" />
            </Button>
          </div>
        </div>
      </section>

      {/* What You Get */}
      <section id="what-you-get" className="py-24 px-6 bg-gradient-to-b from-gray-950 to-black">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold mb-12 text-[#00ff9e]">
              What You Get
            </h2>
          </div>
          
          {/* Four Key Features */}
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <div className="bg-gray-900 p-10 rounded-lg border-2 border-[#00ff9e] hover:bg-gray-800 transition-all group">
              <div className="flex items-start space-x-6">
                <div className="w-16 h-16 bg-[#00ff9e] rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <CheckSquare className="w-8 h-8 text-black" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-4 text-[#00ff9e]">Tasks</h3>
                  <p className="text-lg text-white">
                    See what we're working on right now
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-900 p-10 rounded-lg border-2 border-[#00ff9e] hover:bg-gray-800 transition-all group">
              <div className="flex items-start space-x-6">
                <div className="w-16 h-16 bg-[#00ff9e] rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-8 h-8 text-black" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-4 text-[#00ff9e]">Progress</h3>
                  <p className="text-lg text-white">
                    Instant visibility into wins, blockers, and next steps
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-900 p-10 rounded-lg border-2 border-[#00ff9e] hover:bg-gray-800 transition-all group">
              <div className="flex items-start space-x-6">
                <div className="w-16 h-16 bg-[#00ff9e] rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-8 h-8 text-black" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-4 text-[#00ff9e]">Feedback Loop</h3>
                  <p className="text-lg text-white">
                    Investors and team aligned in one place
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-900 p-10 rounded-lg border-2 border-[#00ff9e] hover:bg-gray-800 transition-all group">
              <div className="flex items-start space-x-6">
                <div className="w-16 h-16 bg-[#00ff9e] rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <Zap className="w-8 h-8 text-black" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-4 text-[#00ff9e]">Execution Hub</h3>
                  <p className="text-lg text-white">
                    Weekly updates, actions, and decisions — all in one view
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6 bg-gray-950">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold mb-12 text-[#00ff9e]">
              How It Works
            </h2>
          </div>
          
          {/* Four-Step Process */}
          <div className="space-y-8 mb-16">
            <div className="flex items-center space-x-8 bg-black p-8 rounded-lg border border-[#00ff9e]">
              <div className="w-12 h-12 bg-[#00ff9e] rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-black font-bold text-xl">1</span>
              </div>
              <p className="text-2xl font-bold text-white">
                We publish everything that matters
              </p>
            </div>
            
            <div className="flex items-center space-x-8 bg-black p-8 rounded-lg border border-[#00ff9e]">
              <div className="w-12 h-12 bg-[#00ff9e] rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-black font-bold text-xl">2</span>
              </div>
              <p className="text-2xl font-bold text-white">
                The pack votes, reacts, and guides direction
              </p>
            </div>
            
            <div className="flex items-center space-x-8 bg-black p-8 rounded-lg border border-[#00ff9e]">
              <div className="w-12 h-12 bg-[#00ff9e] rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-black font-bold text-xl">3</span>
              </div>
              <p className="text-2xl font-bold text-white">
                The team executes
              </p>
            </div>
            
            <div className="flex items-center space-x-8 bg-black p-8 rounded-lg border border-[#00ff9e]">
              <div className="w-12 h-12 bg-[#00ff9e] rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-black font-bold text-xl">4</span>
              </div>
              <p className="text-2xl font-bold text-white">
                Everyone stays synced
              </p>
            </div>
          </div>
          
          {/* Anti-Pattern Statement */}
          <div className="text-center bg-gradient-to-r from-[#00ff9e] to-[#00cc7a] p-12 rounded-lg">
            <p className="text-2xl md:text-3xl font-bold text-black leading-tight">
              No silence. No guessing. No scattered effort.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-gradient-to-b from-gray-950 to-black">
        <div className="max-w-4xl mx-auto text-center">
          {/* Final Hook */}
          <div className="mb-20">
            <h2 className="text-5xl md:text-6xl font-bold mb-16 text-[#00ff9e]">
              Enter the BDOG Board
            </h2>
            
            <p className="text-3xl md:text-4xl font-bold text-white mb-16">
              Stay aligned. Stay informed. Stay in the pack.
            </p>
          </div>
          
          {/* Primary Action */}
          <div className="bg-black p-16 rounded-lg border-4 border-[#00ff9e]">
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <a 
                href="/board/dashboard"
                className="inline-block"
              >
                <Button 
                  variant="primary" 
                  className="px-16 py-8 text-2xl font-bold"
                >
                  Open BDOG Dashboard
                  <ExternalLink className="w-8 h-8 ml-4" />
                </Button>
              </a>
              
              <Button 
                variant="secondary" 
                className="px-16 py-8 text-2xl font-bold border-2 border-[#00ff9e] text-[#00ff9e] hover:bg-[#00ff9e] hover:text-black"
                onClick={() => scrollToSection('why-board')}
              >
                Learn More
                <ArrowRight className="w-8 h-8 ml-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
