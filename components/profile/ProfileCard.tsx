'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Twitter } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';

/**
 * Format principal ID for display
 */
function formatPrincipal(principal: string | null, length: number = 6): string {
  if (!principal) return '@user';
  if (principal.length <= length * 2) {
    return `@${principal}`;
  }
  return `@${principal.slice(0, length)}...${principal.slice(-length)}`;
}

export function ProfileCard() {
  const { principalId } = useAuthStore();
  
  // Mock data
  const [isTwitterVerified, setIsTwitterVerified] = useState(false);
  const mockTwitterUsername = 'bobdogicp';
  const mockLevel = 5;
  const mockXP = 1250;
  
  // Use principal ID for username if available, otherwise use mock
  const displayUsername = isTwitterVerified && mockTwitterUsername 
    ? `@${mockTwitterUsername}` 
    : formatPrincipal(principalId, 6);

  const handleVerifyTwitter = () => {
    // Placeholder - will be implemented later
    console.log('Verify Twitter clicked');
    // For testing, toggle verification state
    setIsTwitterVerified(true);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-6">
        <div className="flex flex-col items-center space-y-4">
          {/* Avatar */}
          <Avatar className="h-24 w-24 border-2 border-border">
            <AvatarImage src="" alt={displayUsername} />
            <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
              {displayUsername.charAt(1).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {/* Username */}
          <div className="text-center">
            <h2 className="text-xl font-semibold text-foreground">
              {displayUsername}
            </h2>
          </div>

          {/* Level and XP */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium">Level {mockLevel}</span>
            <span>•</span>
            <span>{mockXP.toLocaleString()} XP</span>
          </div>

          {/* Twitter Verification */}
          <div className="w-full flex justify-center pt-2">
            {isTwitterVerified ? (
              <Badge 
                variant="default" 
                className="bg-blue-500 hover:bg-blue-600 text-white border-0 gap-1.5 px-3 py-1.5"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Twitter Verified</span>
              </Badge>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleVerifyTwitter}
                className="gap-2"
              >
                <Twitter className="h-4 w-4" />
                <span>Verify Twitter</span>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

