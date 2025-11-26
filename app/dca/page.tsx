'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Label } from '@/components/ui';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { CheckCircle, Sparkles, TrendingUp, Target, Zap, Shield, ArrowRight } from 'lucide-react';
import Image from 'next/image';

const dcaFormSchema = z.object({
  amount: z.string().min(1, 'Amount is required').refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, 'Please enter a valid amount greater than 0'),
  frequency: z.enum(['daily', 'weekly'], {
    message: 'Please select a frequency',
  }),
});

type DCAFormData = z.infer<typeof dcaFormSchema>;

export default function DCAPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<DCAFormData>({
    resolver: zodResolver(dcaFormSchema),
    defaultValues: {
      amount: '',
      frequency: undefined,
    },
  });

  const onSubmit = async (data: DCAFormData) => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsLoading(false);
    setIsSubmitted(true);
    
    // Reset form after showing success
    setTimeout(() => {
      setIsSubmitted(false);
      form.reset();
    }, 3000);
  };

  return (
    <>
    <main className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-[#00ff9e] rounded-full animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-[#00ff9e] rounded-full animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-[#00ff9e] rounded-full animate-pulse delay-500"></div>
        <div className="absolute top-1/2 right-1/3 w-1 h-1 bg-[#00ff9e] rounded-full animate-pulse delay-700"></div>
        <div className="absolute top-1/6 right-1/2 w-1.5 h-1.5 bg-[#00ff9e] rounded-full animate-pulse delay-300"></div>
        <div className="absolute bottom-1/3 right-1/6 w-1 h-1 bg-[#00ff9e] rounded-full animate-pulse delay-900"></div>
      </div>

        <div className="flex-1 flex flex-col px-4 py-8 max-w-sm mx-auto w-full sm:max-w-lg min-h-0">
        
        {/* BOB Logo Section */}
        <section className="text-center mb-8">
          <div className="relative inline-block">
            <div className="w-20 h-20 mx-auto mb-6 transition-transform duration-300 hover:scale-110 hover:rotate-3">
              <Image
                src="/images/bob_logo.png"
                alt="BOB Logo"
                width={80}
                height={80}
                className="rounded-full shadow-lg shadow-[#00ff9e]/20"
              />
            </div>
            {/* Floating sparkles around logo */}
            <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-[#00ff9e] animate-pulse" />
            <Sparkles className="absolute -bottom-2 -left-2 w-3 h-3 text-[#00ff9e] animate-pulse delay-500" />
          </div>
        </section>

        {/* Header Section */}
        <section className="text-center mb-8">
          <h1 className="hero-headline mb-2 text-3xl sm:text-4xl">
            DCA into BOB.
          </h1>
          <p className="hero-subcopy text-base sm:text-lg">
            Don't Wait for the Breakout
          </p>
        </section>

        {/* Success State */}
        {isSubmitted && (
          <div className="mb-8 p-6 bg-gradient-to-r from-[#00ff9e]/10 to-[#00cc7a]/10 border border-[#00ff9e]/30 rounded-lg text-center animate-fade-in">
            <CheckCircle className="w-12 h-12 text-[#00ff9e] mx-auto mb-4 animate-bounce" />
            <h3 className="text-lg font-bold text-[#00ff9e] mb-2">DCA Setup Complete!</h3>
            <p className="text-sm text-gray-300">Your dollar-cost averaging strategy is now active.</p>
          </div>
        )}

        {/* DCA Form */}
        {!isSubmitted && (
          <section className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 flex flex-col justify-center">
              <div className="bg-black/50 border border-gray-800 rounded-lg p-6 backdrop-blur-sm hover:border-[#00ff9e]/30 transition-colors duration-300">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    
                    {/* Amount Field */}
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[#00ff9e] font-semibold">Amount (ICP)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="Enter amount in ICP"
                                className="bg-black/70 border-gray-700 text-white placeholder:text-gray-500 focus:border-[#00ff9e] focus:ring-[#00ff9e]/20 transition-all duration-200"
                                {...field}
                              />
                              <TrendingUp className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Frequency Field */}
                    <FormField
                      control={form.control}
                      name="frequency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[#00ff9e] font-semibold">Frequency</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-black/70 border-gray-700 text-white focus:border-[#00ff9e] focus:ring-[#00ff9e]/20 transition-all duration-200">
                                <SelectValue placeholder="Select frequency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-black border-gray-700">
                              <SelectItem value="daily" className="text-white hover:bg-gray-800 focus:bg-[#00ff9e]/10">
                                Daily
                              </SelectItem>
                              <SelectItem value="weekly" className="text-white hover:bg-gray-800 focus:bg-[#00ff9e]/10">
                                Weekly
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      variant="primary"
                      className="w-full py-3 text-base font-bold transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-[#00ff9e]/20"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                          Setting up DCA...
                        </div>
                      ) : (
                        'Start DCA Strategy'
                      )}
                    </Button>
                  </form>
                </Form>
              </div>

              {/* Info Text */}
              <div className="mt-6 text-center">
                <p className="text-xs text-gray-500">
                  Everyone says they wish they'd stacked Bitcoin early.
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  BOB is the second chance they rarely get.
                </p>
              </div>

              {/* Scroll Hint Button */}
              <div className="mt-6 text-center">
                <button
                  onClick={() => {
                    const element = document.getElementById('extra-section');
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs text-[#00ff9e] border border-[#00ff9e]/30 rounded-full hover:border-[#00ff9e]/60 hover:bg-[#00ff9e]/5 transition-all duration-200"
                >
                  Learn More
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
      
      {/* Extra Section - Separate from form */}
      <section id="extra-section" className="bg-gradient-to-b from-black via-gray-900 to-black py-16 px-4 relative overflow-hidden">
x``
        
        <div className="max-w-sm mx-auto w-full sm:max-w-lg relative z-10">
          {/* Header Section */}
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#00ff9e] mb-3">
              Why DCA Works
            </h2>
            <p className="text-sm text-gray-400 max-w-xs mx-auto">
              The strategy that turns market volatility into your advantage
            </p>
          </div>

          {/* Main Content Card */}
          <div className="bg-gradient-to-br from-gray-900/80 to-black/80 border border-gray-700/50 rounded-xl p-8 backdrop-blur-sm shadow-2xl shadow-[#00ff9e]/5">
            
            {/* Description */}
            <div className="mb-8">
              <p className="text-sm text-gray-300 leading-relaxed text-center">
                Set your schedule, automate your buys, and let your BOB stack grow—regardless of market timing.
              </p>
            </div>
            
            {/* Key Benefits with Icons */}
            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-r from-[#00ff9e]/5 to-transparent border-l-2 border-[#00ff9e]/30">
                <Target className="w-5 h-5 text-[#00ff9e] mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-[#00ff9e] mb-1">
                    No More FOMO Decisions
                  </h4>
                  <p className="text-xs text-gray-400">
                    Stop second-guessing yourself—just stick to the plan
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-r from-[#00ff9e]/5 to-transparent border-l-2 border-[#00ff9e]/30">
                <Zap className="w-5 h-5 text-[#00ff9e] mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-[#00ff9e] mb-1">
                    Set It and Forget It
                  </h4>
                  <p className="text-xs text-gray-400">
                    Your stack grows while you sleep, work, or live your life
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-r from-[#00ff9e]/5 to-transparent border-l-2 border-[#00ff9e]/30">
                <Shield className="w-5 h-5 text-[#00ff9e] mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-[#00ff9e] mb-1">
                    Get In Before Everyone Else
                  </h4>
                  <p className="text-xs text-gray-400">
                    While others wait for "the right time," you're already stacking
                  </p>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </section>
    </main>
    </>
  );
}
