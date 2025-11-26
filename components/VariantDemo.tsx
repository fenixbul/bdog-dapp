'use client';

import ScrollArrow from './ScrollArrow';

const VariantDemo = () => {
  return (
    <div className="p-8 bg-gray-50">
      <h2 className="text-3xl font-bold text-center mb-8">Component Variants Demo</h2>
      
      {/* Arrow Variants */}
      <div className="mb-12">
        <h3 className="text-2xl font-bold mb-6 text-center">Arrow Button Variants</h3>
        <div className="flex flex-wrap justify-center gap-8">
          <div className="text-center">
            <p className="mb-2 font-semibold">Classic (with bounce)</p>
            <ScrollArrow targetId="demo-section" variant="classic" />
          </div>
          <div className="text-center">
            <p className="mb-2 font-semibold">Pulse (gradient)</p>
            <ScrollArrow targetId="demo-section" variant="pulse" />
          </div>
          <div className="text-center">
            <p className="mb-2 font-semibold">Minimal</p>
            <ScrollArrow targetId="demo-section" variant="minimal" />
          </div>
          <div className="text-center">
            <p className="mb-2 font-semibold">Bold</p>
            <ScrollArrow targetId="demo-section" variant="bold" />
          </div>
        </div>
      </div>

      {/* Section Variants Preview */}
      <div className="space-y-8">
        <h3 className="text-2xl font-bold text-center">Section Variants</h3>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bob-card">
            <h4 className="font-bold mb-2">Story Variant</h4>
            <p className="text-sm text-gray-600">Narrative-focused, emotional connection to Dogecoin legacy</p>
            <div className="mt-3 text-xs">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">Storytelling</span>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded ml-2">Community</span>
            </div>
          </div>
          
          <div className="bob-card">
            <h4 className="font-bold mb-2">Technical Variant</h4>
            <p className="text-sm text-gray-600">Feature comparison, roadmap, technical foundations</p>
            <div className="mt-3 text-xs">
              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">Technical</span>
              <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded ml-2">Roadmap</span>
            </div>
          </div>
          
          <div className="bob-card">
            <h4 className="font-bold mb-2">Community Variant</h4>
            <p className="text-sm text-gray-600">Mission-focused, collaboration emphasis, pack mentality</p>
            <div className="mt-3 text-xs">
              <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded">Community</span>
              <span className="bg-red-100 text-red-800 px-2 py-1 rounded ml-2">Mission</span>
            </div>
          </div>
          
          <div className="bob-card border-2 border-black">
            <h4 className="font-bold mb-2">Legacy Variant</h4>
            <p className="text-sm text-gray-600">Black background, timeline design, footer-inclusive height</p>
            <div className="mt-3 text-xs">
              <span className="bg-black text-white px-2 py-1 rounded">Dark Theme</span>
              <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded ml-2">Timeline</span>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Section Target */}
      <div id="demo-section" className="mt-16 p-8 bg-white rounded-lg border-2 border-gray-200">
        <h3 className="text-xl font-bold text-center">🎯 Demo Target Section</h3>
        <p className="text-center text-gray-600 mt-2">This is where the arrows scroll to!</p>
      </div>
    </div>
  );
};

export default VariantDemo;
