// src/utils/kpiCalculators.js

export const calculateKPIs = (tenders = []) => {
  // 1. Guard clause: Return numbers for all keys
  if (!Array.isArray(tenders) || tenders.length === 0) {
    return { 
      total_count: 0, 
      win_rate: 0, 
      total_won_value: 0, 
      active_lost_ratio: 0 
    };
  }

  // 2. Process data in one pass
  const metrics = tenders.reduce((acc, t) => {
    // Basic validation to skip empty rows
    if (!t) return acc;

    const status = (t.Status || t.status || t.tender_status || '').trim().toLowerCase();
    
    // Logic: If status is empty, it's not a valid tender record
    if (!status) return acc;

    acc.totalCount += 1;

    // Use "Quoted Value" from CSV as fallback if tender_open_price isn't present
    // Based on source 1, the numerical values are under "Quoted Value" 
    const revenueVal = Number(t.tender_open_price || t['Tender Open Price'] || t['Quoted Value'] || 0);

    // Classification logic using fuzzy matching (.includes)
    if (status.includes('won')) {
      acc.wonCount += 1;
      acc.totalWonValue += revenueVal; // Revenue only for Won status [cite: 1, 3]
    } else if (status.includes('lost')) {
      acc.lostCount += 1;
    } else if (status.includes('quoted') || status.includes('received')) {
      // Catches "Tender Quoted", "Quoted", and "Tender Received" [cite: 1, 15, 35]
      acc.quotedCount += 1;
    }

    return acc;
  }, { 
    totalCount: 0, 
    wonCount: 0, 
    lostCount: 0, 
    quotedCount: 0, 
    totalWonValue: 0 
  });

  // 3. Calculation: Win Rate (Won / Won + Lost + Quoted)
  const winDenominator = metrics.wonCount + metrics.lostCount + metrics.quotedCount;
  const winRateValue = winDenominator > 0 
    ? (metrics.wonCount / winDenominator) * 100 
    : 0;

  // 4. Calculation: Efficiency (Quoted / Lost)
  // Return as a raw number so the component can handle formatting
  const activeLostRatio = metrics.lostCount > 0 
    ? (metrics.quotedCount / metrics.lostCount) 
    : metrics.quotedCount;

  return {
    total_count: metrics.totalCount,
    win_rate: winRateValue.toFixed(1), // String for UI % display
    total_won_value: metrics.totalWonValue,
    active_lost_ratio: activeLostRatio // Return as Number for the UI to format
  };
};