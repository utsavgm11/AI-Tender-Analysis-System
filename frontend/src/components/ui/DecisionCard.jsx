import React from 'react';

const DecisionCard = ({ result, onClose }) => {
  const data = result.aarvi_intelligence || result; // Handle wrapper or direct obj

  const downloadReport = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Tender_Report_${data.tender_no || 'Analysis'}.json`;
    a.click();
  };

  return (
    <div className="bg-white p-6 rounded-xl border shadow-lg max-w-4xl mx-auto my-4 text-sm">
      <div className="flex justify-between items-center border-b pb-4 mb-4">
        <h2 className="text-xl font-bold">Strategic Tender Analysis</h2>
        <button onClick={downloadReport} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold">
          Download Report
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Section title="Eligibility & PQ" content={data.key_eligibility} />
        <Section title="Financial & Tech" content={data.financial_eligibility} />
        <Section title="Experience Req." content={data.min_experience} />
        <Section title="Net Worth Check" content={data.net_worth_check} />
        <Section title="Scope of Work" content={data.scope_of_work} />
        <Section title="Penalty Terms" content={data.penalty_terms} />
        <Section title="Similar Work History" content={data.similar_work} />
        <Section title="Strategic Advice" content={data.strategic_advice} />
      </div>

      <div className="mt-6 p-4 bg-slate-100 rounded-lg font-black text-center text-lg">
        DECISION: {data.bid_decision}
      </div>
    </div>
  );
};

const Section = ({ title, content }) => (
  <div>
    <h4 className="font-bold text-slate-500 uppercase text-[10px]">{title}</h4>
    <p className="text-slate-800">{content}</p>
  </div>
);

export default DecisionCard;