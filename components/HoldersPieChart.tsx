'use client';

import { useEffect, useState } from 'react';
import { holdersService, type HolderData } from '@/lib/holders-service';

interface HoldersPieChartProps {
  className?: string;
}

const HoldersPieChart = ({ className = '' }: HoldersPieChartProps) => {
  const [holders, setHolders] = useState<HolderData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHolders = async () => {
      try {
        const response = await holdersService.getTopHolders(25); // Get more to account for filtering
        if (!response.error) {
          // Filter out pool principal and take top 20
          const filteredHolders = response.holders
            .filter(holder => holder.principal !== "h7uwa-hyaaa-aaaam-qbgvq-cai") // Skip pool
            .slice(0, 20);
          setHolders(filteredHolders);
        }
      } catch (error) {
        console.error('Failed to fetch holders for pie chart:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHolders();
  }, []);

  // Generate colors for the pie chart segments
  const generateColors = (count: number) => {
    const colors = [
      '#000', // Primary green
      '#ffd000  ', // Darker green
      '#ff6b6b', // Red
      '#4ecdc4', // Teal
      '#45b7d1', // Blue
      '#f9ca24', // Yellow
      '#f0932b', // Orange
      '#eb4d4b', // Dark red
      '#6c5ce7', // Purple
      '#a29bfe', // Light purple
      '#fd79a8', // Pink
      '#fdcb6e', // Light orange
      '#e17055', // Brown
      '#74b9ff', // Light blue
      '#81ecec', // Light teal
      '#fab1a0', // Peach
      '#00b894', // Dark teal
      '#e84393', // Dark pink
      '#2d3436', // Dark gray
      '#636e72', // Gray
    ];
    
    return colors.slice(0, count);
  };

  // Calculate angles for pie segments
  const calculateSegments = (holders: HolderData[]) => {
    const total = holders.reduce((sum, holder) => sum + holder.percentage, 0);
    let currentAngle = 0;
    
    return holders.map((holder, index) => {
      const percentage = holder.percentage;
      const angle = (percentage / total) * 360;
      
      // Special color for DEV principal
      let color = generateColors(holders.length)[index];
      if (holder.principal === "qdzln-ab4cf-cwgaa-nyzus-x3gag-o7kxy-ktiew-jtwrb-pmit5-m6txi-cqe") {
        color = '#00e68a'; // Always use this color for DEV
      }
      
      const segment = {
        percentage,
        startAngle: currentAngle,
        endAngle: currentAngle + angle,
        color,
      };
      currentAngle += angle;
      return segment;
    });
  };

  // Create SVG path for pie segment
  const createPath = (centerX: number, centerY: number, radius: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(centerX, centerY, radius, endAngle);
    const end = polarToCartesian(centerX, centerY, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    
    return [
      "M", centerX, centerY,
      "L", start.x, start.y,
      "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
      "Z"
    ].join(" ");
  };

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };

  if (loading) {
    return (
      <div className={`stats-card ${className}`}>
        <div className="animate-pulse">
          <div className="stats-label mb-4">Top Holders Distribution</div>
          <div className="flex justify-center">
            <div className="w-48 h-48 bg-gray-200 rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (holders.length === 0) {
    return (
      <div className={`stats-card ${className}`}>
        <div className="stats-label mb-4">Top Holders Distribution</div>
        <div className="flex justify-center items-center h-48">
          <p className="text-gray-400">No holder data available</p>
        </div>
      </div>
    );
  }

  const segments = calculateSegments(holders);
  const size = 192; // 48 * 4 (w-48 h-48)
  const center = size / 2;
  const radius = size / 2 - 4;

  // Helper function to get text position for labels
  const getTextPosition = (centerX: number, centerY: number, radius: number, startAngle: number, endAngle: number) => {
    const midAngle = (startAngle + endAngle) / 2;
    const textRadius = radius * 0.60; // Position text at 70% of radius
    return polarToCartesian(centerX, centerY, textRadius, midAngle);
  };

  return (
    <div className={`stats-card ${className}`}>
      <div className="stats-label mb-4">Top Holders Distribution</div>
      <div className="flex justify-center">
        <svg width={size} height={size} className="transform -rotate-90">
          {segments.map((segment, index) => {
            const holder = holders[index];
            const isDev = holder.principal === "qdzln-ab4cf-cwgaa-nyzus-x3gag-o7kxy-ktiew-jtwrb-pmit5-m6txi-cqe";
            
            return (
              <g key={index}>
                <path
                  d={createPath(center, center, radius, segment.startAngle, segment.endAngle)}
                  fill={segment.color}
                  stroke="#000"
                  strokeWidth="1"
                  className="hover:opacity-80 transition-opacity"
                />
                {isDev && (
                  <text
                    x={getTextPosition(center, center, radius, segment.startAngle, segment.endAngle).x}
                    y={getTextPosition(center, center, radius, segment.startAngle, segment.endAngle).y}
                    fill="black"
                    fontSize="12"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="transform rotate-90"
                    style={{ transformOrigin: `${getTextPosition(center, center, radius, segment.startAngle, segment.endAngle).x}px ${getTextPosition(center, center, radius, segment.startAngle, segment.endAngle).y}px` }}
                  >
                    DEV
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-400">
          Showing top {holders.length + 1} holders
        </p>
      </div>
    </div>
  );
};

export default HoldersPieChart;

