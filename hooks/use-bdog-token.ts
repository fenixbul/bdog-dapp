"use client";

import { useEffect, useState } from 'react';
import { getBobpadActor } from '@/lib/actors';
import type { TokenExtended } from '@/lib/canisters/bobpad.did.d.ts';

export const useBdogToken = () => {
  const [tokenData, setTokenData] = useState<TokenExtended | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const testTokenId = 13346325789471485573n; // BDOG token ID

  useEffect(() => {
    const fetchTokenData = async () => {
      try {
        const actor = getBobpadActor();
        const response = await actor.get_tokens_from_ids([testTokenId]);
        
        if (response[0] && response[0].length > 0) {
          setTokenData(response[0][0]);
        } else {
          setError('Token not found');
        }
      } catch (err) {
        console.error('Failed to fetch token data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchTokenData();
  }, []);

  return { tokenData, loading, error };
};
