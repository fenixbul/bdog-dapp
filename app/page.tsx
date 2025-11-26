'use client';

import { Button, StatsCard } from "@/components/ui";
import { LogoVariant3 } from "@/components/logos";
import ScrollArrow from "@/components/ScrollArrow";
import { Rocket, Sparkles } from "lucide-react";
import Image from "next/image";
import TopHoldersV2 from "@/components/TopHoldersV2";

// To test different logo variants, simply change LogoVariant1 to LogoVariant2 or LogoVariant3 in the component below

export default function LandingPage() {

  const scrollToTimeline = () => {
    const element = document.getElementById('timeline');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* Hero Section */}
      <main className="dynamic-screen bg-background flex flex-col relative">
        {/* Mobile-optimized layout */}
        <div className="flex-1 flex flex-col px-4 py-6 mx-auto w-full sm:max-w-lg md:max-w-2xl lg:max-w-4xl">
        
        {/* Compact Logo Section */}
        <section className="text-center mb-6">
          <div className="scale-75 sm:scale-100">
            <LogoVariant3 />
          </div>
        </section>
        
        {/* Hero Content - Mobile First */}
        <section className="flex-1 flex flex-col lg:justify-center pb-20">
          
          {/* Stats Card - Top on Mobile */}
          <div className="flex justify-center lg:mb-4 lg:hidden mb-10">
            <div className="w-full lg:max-w-xs">
              {/* <TokenStats className="!max-w-none !w-full" /> */}
              <StatsCard />
            </div>
          </div>
          
          {/* Desktop Layout */}
          <div className="hidden lg:grid lg:grid-cols-2 lg:gap-12 lg:items-center lg:h-full">
            {/* Left Panel - Content */}
            <div className="flex flex-col justify-center">
              <h1 className="hero-headline mb-0">
              BOB's <br></br>best friend
              </h1>
              
              <p className="hero-subcopy mb-8 max-w-lg mt-2">
                <b>BDOG</b> makes the <b>BOB</b> story simple.
              </p>
              
              {/* Primary CTA */}
              <div className="mb-6 flex flex-col sm:flex-row gap-3 max-w-sm">
                <a 
                  href="https://app.icpswap.com/swap/pro?input=ryjl3-tyaaa-aaaaa-aaaba-cai&output=2qqix-tiaaa-aaaam-qeria-cai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block"
                >
                  <Button variant="primary" className="w-full sm:w-auto">
                    Buy $BDOG
                  </Button>
                </a>
                <Button 
                  variant="secondary" 
                  className="w-full sm:w-auto"
                  onClick={scrollToTimeline}
                >
                  Whitepaper
                </Button>
              </div>
              
              {/* Social Links */}
              <div className="flex flex-col text-gray-400 sm:flex-row gap-4 text-sm">
                <span className="inline-flex items-center gap-1 cursor-not-allowed">
                  <a href="https://t.me/bobDOGicp" target="_blank" rel="noopener noreferrer">
                    📱 Telegram
                  </a>
                </span>
                <a 
                  href="https://x.com/bobdogicp" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="  transition-colors inline-flex items-center gap-1"
                  aria-label="Follow BDOG on Twitter"
                >
                  <Image 
                    src="/images/X.png" 
                    alt="X" 
                    width={14} 
                    height={14}
                    className="inline-block opacity-70"
                  />
                  Follow
                </a>
                <a 
                  href="https://oc.app/community/l3okb-7aaaa-aaaac-a463q-cai/?ref=l4pmv-syaaa" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className=" inline-flex items-center gap-1"
                  aria-label="Join OpenChat Community"
                >
                  <Image 
                    src="/images/chat.png" 
                    alt="OpenChat" 
                    width={16} 
                    height={16}
                    className="inline-block"
                  />
                  OpenChat
                </a>
              </div>
            </div>
            
            {/* Right Panel - Stats */}
            <div className="flex flex-col items-center justify-center space-y-6">
              <StatsCard />
            </div>
          </div>
          
          {/* Mobile Content */}
          <div className="lg:hidden flex flex-col justify-center text-center space-y-6">
            <h1 className="text-2xl sm:text-3xl font-bold leading-tight">
              BOB's best friend
            </h1>
            
            <p className="text-base sm:text-lg text-gray-600 leading-relaxed max-w-sm mx-auto">
              <b>BDOG</b> makes the <b>BOB</b> story simple.
            </p>
            
            {/* Primary CTA */}
            <div className="space-y-3 max-w-sm mx-auto">
              <a 
                href="https://app.icpswap.com/swap/pro?input=ryjl3-tyaaa-aaaaa-aaaba-cai&output=2qqix-tiaaa-aaaam-qeria-cai"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block w-full"
              >
                <Button variant="primary" className="w-full py-3 text-base font-semibold">
                  Buy $BDOG
                </Button>
              </a>
              <Button 
                variant="secondary" 
                className="w-full py-3 text-base font-semibold"
                onClick={scrollToTimeline}
              >
                Roadmap
              </Button>
            </div>
            
            {/* Social Links */}
            <div className="flex justify-center gap-6 text-sm">
              <span className="text-gray-400 inline-flex items-center gap-1 cursor-not-allowed">
                <a href="https://t.me/bobDOGicp" target="_blank" rel="noopener noreferrer">
                  📱 Telegram
                </a>
              </span>
              <a 
                href="https://x.com/bobdogicp" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 transition-colors inline-flex items-center gap-1"
                aria-label="Follow BDOG on Twitter"
              >
                <Image 
                  src="/images/X.png" 
                  alt="X" 
                  width={14} 
                  height={14}
                  className="inline-block opacity-70"
                /> 
                Follow
              </a>
              <a 
                href="https://oc.app/community/l3okb-7aaaa-aaaac-a463q-cai/?ref=l4pmv-syaaa" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 inline-flex items-center gap-1"
                aria-label="Join OpenChat Community"
              >
                <Image 
                  src="/images/chat.png" 
                  alt="OpenChat" 
                  width={16} 
                  height={16}
                  className="inline-block"
                />
                OpenChat
              </a>
            </div>
          </div>
          
        </section>
        
        {/* Scroll Arrow - positioned at bottom center */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
          <ScrollArrow targetId="holders" variant="classic" />
        </div>
      </div>
      </main>
      
      {/* Top Holders Section */}
      <section id="holders" className="bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <TopHoldersV2 />
        </div>
      </section>
      
      {/* Timeline Section */}
      {/* <Timeline /> */}
      <div className="bg-black text-white min-h-screen flex items-center justify-center relative overflow-hidden" id="timeline">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-[#00ff9e] rounded-full animate-pulse"></div>
          <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-[#00ff9e] rounded-full animate-pulse delay-1000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-[#00ff9e] rounded-full animate-pulse delay-500"></div>
          <div className="absolute top-1/2 right-1/3 w-1 h-1 bg-[#00ff9e] rounded-full animate-pulse delay-700"></div>
        </div>
        
        <div className="text-center z-10 max-w-md mx-auto px-6">
          {/* Animated icon container */}
          <div className="relative mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#00ff9e] to-[#00cc7a] rounded-full mb-4 animate-bounce">
              <Rocket className="w-10 h-10 text-black" />
            </div>
            {/* Sparkles around the rocket */}
            <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-[#00ff9e] animate-pulse" />
            <Sparkles className="absolute -bottom-1 -left-3 w-4 h-4 text-[#00ff9e] animate-pulse delay-300" />
          </div>
          
          {/* Main heading with gradient text */}
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-[#00ff9e] to-[#00cc7a] bg-clip-text text-transparent animate-pulse">
            Coming Soon
          </h2>
          
          {/* Subtitle */}
          <p className="text-lg text-gray-300 mb-8 animate-fade-in">
            Consistency builds the base...
          </p>
          
          {/* Animated loading dots */}
          <div className="flex justify-center space-x-2">
            <div className="w-3 h-3 bg-[#00ff9e] rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-[#00ff9e] rounded-full animate-bounce delay-100"></div>
            <div className="w-3 h-3 bg-[#00ff9e] rounded-full animate-bounce delay-200"></div>
          </div>
        </div>
      </div>
    </>
  );
}
