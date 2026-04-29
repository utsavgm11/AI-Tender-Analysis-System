// src/utils/kpiCalculators.js

export const calculateKPIs = (tenders = []) => {
  // Guard clause: Return zeros if no data is provided
  if (!Array.isArray(tenders) || tenders.length === 0) {
    return { totalReceived: 0, totalQuoted: 0, winPercentage: 0, totalWonValue: 0 };
  }

  // Single pass through the array: Efficient O(n) complexity
  const metrics = tenders.reduce((acc, t) => {
    acc.totalReceived += 1;

    // Sanitize status to be case-insensitive and trim whitespace
    const status = (t.status || '').trim().toLowerCase();

    if (status === 'tender quoted') {
      acc.totalQuoted += 1;
    }

    if (status === 'tender won') {
      acc.totalWonValue += Number(t.contract_value) || 0;
      acc.wonCount += 1; 
    }

    return acc;
  }, { 
    totalReceived: 0, 
    totalQuoted: 0, 
    totalWonValue: 0, 
    wonCount: 0 
  });

  // Calculate percentage safely to avoid Division by Zero/NaN
  const winPercentage = metrics.totalQuoted > 0 
    ? (metrics.wonCount / metrics.totalQuoted) * 100 
    : 0;

  return {
    totalReceived: metrics.totalReceived,
    totalQuoted: metrics.totalQuoted,
    winPercentage,
    totalWonValue: metrics.totalWonValue
  };
};