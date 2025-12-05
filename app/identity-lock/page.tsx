'use client';

import React from 'react';
import { Button } from "@/components/ui";
import { 
  Volume2, 
  VolumeX, 
  Users, 
  Zap, 
  Eye, 
  TrendingUp, 
  MessageCircle,
  ArrowRight,
  Sparkles,
  UserPlus
} from "lucide-react";

export default function IdentityLock() {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-black text-white min-h-screen">
      {/* Hero Section - 7-Second Hook */}
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
              <Volume2 className="w-14 h-14 text-black" />
            </div>
            <Sparkles className="absolute -top-3 -right-3 w-10 h-10 text-[#00ff9e] animate-bounce" />
          </div>
          
          {/* 7-Second Hook */}
          <h1 className="text-6xl md:text-8xl font-bold mb-8 bg-gradient-to-r from-[#00ff9e] to-[#00cc7a] bg-clip-text text-transparent leading-tight">
            BDOG
          </h1>
          
          {/* Power Message */}
          <p className="text-3xl md:text-5xl font-bold text-white mb-16 leading-tight">
            BDOG is the voice BOB lost.
          </p>
          
          {/* Direct CTA */}
          <div className="mb-16">
            <Button 
              variant="primary" 
              className="px-12 py-6 text-xl font-bold"
              onClick={() => scrollToSection('silence-kills')}
            >
              See The Problem
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

      {/* Problem Section - Silence Kills Projects */}
      <section id="silence-kills" className="py-24 px-6 bg-gradient-to-b from-black to-red-950 relative">
        <div className="max-w-4xl mx-auto text-center">
          {/* Enemy Visual */}
          <div className="mb-16">
            <div className="inline-flex items-center justify-center w-32 h-32 bg-red-900 rounded-full mb-8 border-4 border-red-600">
              <VolumeX className="w-16 h-16 text-red-400" />
            </div>
            <h2 className="text-5xl md:text-7xl font-bold mb-12 text-red-400">
              Silence Kills Projects
            </h2>
          </div>
          
          {/* Quick Impact Points */}
          <div className="space-y-8 mb-16">
            <p className="text-3xl md:text-4xl font-bold text-white">
              BOB went silent. Holders scattered.
            </p>
            <p className="text-3xl md:text-4xl font-bold text-white">
              Projects die without a voice.
            </p>
          </div>
          
          {/* Transition to Solution */}
          <div className="text-center">
            <Button 
              variant="primary" 
              className="px-12 py-6 text-xl font-bold"
              onClick={() => scrollToSection('bdog-fix')}
            >
              The BDOG Fix
              <ArrowRight className="w-6 h-6 ml-3" />
            </Button>
          </div>
        </div>
      </section>

      {/* The BDOG Fix */}
      <section id="bdog-fix" className="py-24 px-6 bg-gradient-to-b from-red-950 to-black">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold mb-12 text-[#00ff9e]">
              The BDOG Fix
            </h2>
          </div>
          
          {/* Three Pillars */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="text-center group">
              <div className="w-24 h-24 bg-[#00ff9e] rounded-full flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform">
                <Volume2 className="w-12 h-12 text-black" />
              </div>
              <h3 className="text-3xl font-bold text-[#00ff9e] mb-4">Voice</h3>
              <p className="text-xl text-white">BOB speaks again</p>
            </div>
            
            <div className="text-center group">
              <div className="w-24 h-24 bg-[#00ff9e] rounded-full flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform">
                <Zap className="w-12 h-12 text-black" />
              </div>
              <h3 className="text-3xl font-bold text-[#00ff9e] mb-4">Energy</h3>
              <p className="text-xl text-white">Hype that never stops</p>
            </div>
            
            <div className="text-center group">
              <div className="w-24 h-24 bg-[#00ff9e] rounded-full flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform">
                <Users className="w-12 h-12 text-black" />
              </div>
              <h3 className="text-3xl font-bold text-[#00ff9e] mb-4">Unity</h3>
              <p className="text-xl text-white">Pack moves together</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Join the Pack */}
      <section className="py-24 px-6 bg-gray-950">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold mb-12 text-[#00ff9e]">
              Why Join the Pack
            </h2>
          </div>
          
          {/* Three Key Benefits */}
          <div className="space-y-8 mb-16">
            <div className="text-center bg-black p-8 rounded-lg border border-[#00ff9e]">
              <p className="text-2xl font-bold text-white">
                Never miss BOB updates again
              </p>
            </div>
            
            <div className="text-center bg-black p-8 rounded-lg border border-[#00ff9e]">
              <p className="text-2xl font-bold text-white">
                Move with the pack, not alone
              </p>
            </div>
            
            <div className="text-center bg-black p-8 rounded-lg border border-[#00ff9e]">
              <p className="text-2xl font-bold text-white">
                Your voice gets heard
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The Promise */}
      <section className="py-24 px-6 bg-gradient-to-b from-gray-950 to-black">
        <div className="max-w-4xl mx-auto text-center">
          {/* Promise */}
          <div className="mb-20">
            <h2 className="text-5xl md:text-6xl font-bold mb-16 text-[#00ff9e]">
              The Promise
            </h2>
            
            <div className="space-y-8 mb-16">
              <p className="text-3xl md:text-4xl font-bold text-white">
                We bring the holders back.
              </p>
              <p className="text-3xl md:text-4xl font-bold text-white">
                We bring the narrative back.
              </p>
              <p className="text-3xl md:text-4xl font-bold text-[#00ff9e]">
                We bring BOB back.
              </p>
            </div>
          </div>
          
          {/* CTA */}
          <div className="bg-black p-16 rounded-lg border-4 border-[#00ff9e]">
            <h3 className="text-4xl md:text-5xl font-bold mb-12 text-[#00ff9e]">
              Join the Pack
            </h3>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <a 
                href="https://t.me/bobDOGicp" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block"
              >
                <Button 
                  variant="primary" 
                  className="px-16 py-8 text-2xl font-bold"
                >
                  Join Telegram
                  <UserPlus className="w-8 h-8 ml-4" />
                </Button>
              </a>
              
              <a 
                href="https://app.icpswap.com/swap?input=ryjl3-tyaaa-aaaaa-aaaba-cai&output=2qqix-tiaaa-aaaam-qeria-cai"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block"
              >
                <Button 
                  variant="secondary" 
                  className="px-16 py-8 text-2xl font-bold border-2 border-[#00ff9e] text-[#00ff9e] hover:bg-[#00ff9e] hover:text-black"
                >
                  Buy $BDOG
                  <TrendingUp className="w-8 h-8 ml-4" />
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
