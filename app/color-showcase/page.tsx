'use client';

import { Button } from "@/components/ui";

export default function ColorShowcasePage() {
  return (
    <main className="min-h-screen bg-background">

      {/* Badge Example Section */}
      <section className="bg-gradient-vertical py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-white text-3xl md:text-4xl font-bold mb-8 text-center">
            Badge Examples
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {/* Primary Color Badge */}
            <div className="bg-[#00ff9e] text-black px-6 py-3  font-bold text-sm uppercase tracking-wider">
              Primary Badge
            </div>
            
          </div>
          
        </div>
      </section>

      {/* Vertical Gradient Container Section */}
      <section className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-white text-4xl md:text-5xl font-bold mb-6">
            Vertical Gradient Container
          </h1>
          <p className="text-white text-lg md:text-xl opacity-90 mb-8">
            This full-screen container demonstrates the vertical gradient from dark red (#431405) at the top transitioning to black at the bottom.
          </p>
          <p className="text-white text-base md:text-lg opacity-80">
            The gradient creates a dramatic effect perfect for hero sections and full-screen banners. The dark red color provides depth while maintaining readability with white text.
          </p>
        </div>
      </section>

      {/* Horizontal Banner Section */}
      <section className="bg-gradient-horizontal w-full py-12 px-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1">
              <h2 className="text-white text-2xl md:text-3xl font-bold mb-3">
                Horizontal Banner Message
              </h2>
              <p className="text-white text-base md:text-lg opacity-90">
                This banner demonstrates the horizontal gradient from magenta (#A72A99) to blue (#4E9AD9) with white text and a white button.
              </p>
            </div>
            <Button 
              variant="secondary" 
              className="bg-white text-gray-900 hover:bg-gray-100 border-white whitespace-nowrap"
            >
              White Button
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}

