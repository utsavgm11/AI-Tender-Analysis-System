import React from 'react';

// Formatter to handle bolding and bullet points formally
const renderFormalContent = (text) => {
  if (!text || text === "Not Specified") return <span className="italic text-gray-500">Not Specified</span>;
  
  return text.split('\n').map((line, index) => {
    const isBullet = line.trim().startsWith('•') || line.trim().startsWith('-');
    const cleanLine = line.replace(/^[•-]\s*/, '');
    
    const parts = cleanLine.split(/(\*\*.*?\*\*)/g);
    const formattedLine = parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-black">{part.slice(2, -2)}</strong>;
      }
      return part;
    });

    return (
      // Reduced side padding here so text has maximum width
      <div key={index} className={`mb-1 ${isBullet ? 'pl-5 pr-2 relative' : 'mt-1.5 mb-1.5 pr-2'}`}>
        {isBullet && <span className="absolute left-1 top-0 text-black font-bold text-[15px]">•</span>}
        <span className="leading-snug text-left">{formattedLine}</span>
      </div>
    );
  });
};

const PrintableTenderReport = ({ d, bidDecision }) => {
  return (
    // Reduced container padding from px-12 to px-8 to give the tables more horizontal room
    <div id="printable-report" className="bg-white px-8 py-8 font-serif text-black" style={{ width: '750px', minHeight: '1123px' , margin: '0 auto',
  boxSizing: 'border-box'}}>
      
      {/* --- HEADER (Formal Letterhead) --- */}
      <div className="text-center border-b-2 border-black pb-4 mb-6">
        <h1 className="text-2xl font-extrabold uppercase tracking-widest text-black">AARVI ENCON</h1>
        <h2 className="text-base font-bold uppercase tracking-widest mt-1 border-t border-black pt-1 inline-block">
          Strategic Tender Intelligence Report
        </h2>
        <p className="text-[11px] mt-2 font-mono">DOCUMENT ID: {d.tender_no} | DATE: {new Date().toLocaleDateString()}</p>
      </div>

      {/* --- SECTION 1.0: PROJECT METADATA --- */}
      <h3 className="text-lg font-bold mb-2 border-b border-black pb-1 uppercase">1.0 Project Identification</h3>
      {/* Base text size reduced to 13px (text-[13px]) to ensure everything fits A4 perfectly */}
      <table className="w-full text-[13px] border-collapse mb-6 border border-black">
        <tbody>
          <tr>
            <td className="px-3 py-2 border border-black font-bold w-[25%] bg-gray-50">Tender Reference</td>
            <td className="px-3 py-2 border border-black w-[75%]">{d.tender_no}</td>
          </tr>
          <tr>
            <td className="px-3 py-2 border border-black font-bold bg-gray-50">Client Organization</td>
            <td className="px-3 py-2 border border-black font-bold text-sm">{d.client_name}</td>
          </tr>
          <tr>
            <td className="px-3 py-2 border border-black font-bold bg-gray-50 align-top">Project Description</td>
            <td className="px-3 py-2 border border-black text-left italic">{d.description}</td>
          </tr>
        </tbody>
      </table>

      {/* --- SECTION 2.0: AI DECISION MATRIX --- */}
      <h3 className="text-lg font-bold mb-2 border-b border-black pb-1 uppercase">2.0 Executive Bid Decision</h3>
      <table className="w-full text-[13px] border-collapse mb-6 border-2 border-black">
        <tbody>
          <tr>
            {/* Column widths strictly set to 20% for labels, 30% for data to prevent crushing */}
            <td className="px-3 py-3 border border-black font-bold w-[20%] bg-gray-100 text-left uppercase">AI Recommendation</td>
            <td className="px-3 py-3 border border-black font-extrabold text-base text-left uppercase tracking-widest w-[30%]">{bidDecision}</td>
            <td className="px-3 py-3 border border-black font-bold w-[20%] bg-gray-100 text-left uppercase">Win Probability</td>
            <td className="px-3 py-3 border border-black font-bold text-sm text-left w-[30%]">{d.win_probability}</td>
          </tr>
          <tr>
            <td className="px-3 py-3 border border-black font-bold bg-gray-50 text-left uppercase">Profit Forecast</td>
            <td className="px-3 py-3 border border-black font-bold text-sm text-left">{d.profit_forecast}</td>
            <td className="px-3 py-3 border border-black font-bold bg-gray-50 text-left uppercase">PQ Status</td>
            <td className="px-3 py-3 border border-black font-bold text-sm text-left">{d.pq_status}</td>
          </tr>
        </tbody>
      </table>

      {/* --- SECTION 3.0: FINANCIAL & TECHNICAL --- */}
      <h3 className="text-lg font-bold mb-2 border-b border-black pb-1 uppercase">3.0 Qualification & Scope</h3>
      <table className="w-full text-[13px] border-collapse mb-6 border border-black">
        <tbody>
          <tr>
            <td className="px-3 py-3 border border-black font-bold bg-gray-50 w-[25%] align-top">Financial Requirements</td>
            <td className="px-3 py-3 border border-black align-top w-[75%]">{renderFormalContent(d.financial_qualification)}</td>
          </tr>
          <tr>
            <td className="px-3 py-3 border border-black font-bold bg-gray-50 align-top">Technical Experience</td>
            <td className="px-3 py-3 border border-black align-top">{renderFormalContent(d.technical_qualification)}</td>
          </tr>
          <tr>
            <td className="px-3 py-3 border border-black font-bold bg-gray-50 align-top">Scope of Work</td>
            <td className="px-3 py-3 border border-black align-top">{renderFormalContent(d.scope_of_work)}</td>
          </tr>
          <tr>
            <td className="px-3 py-3 border border-black font-bold bg-gray-50 align-top">Manpower Allocation</td>
            <td className="px-3 py-3 border border-black align-top leading-relaxed">
              <strong>Headcount:</strong> {d.manpower_count} <br/>
              <strong>Shifts:</strong> {d.shift_duty}
            </td>
          </tr>
        </tbody>
      </table>

      {/* --- SECTION 4.0: COMPLIANCE & RISK --- */}
      <h3 className="text-lg font-bold mb-2 border-b border-black pb-1 uppercase">4.0 Risk Assessment & Compliance</h3>
      <table className="w-full text-[13px] border-collapse mb-6 border border-black">
        <tbody>
          <tr>
            <td className="px-3 py-3 border border-black font-bold bg-gray-50 w-[25%] align-top">Mandatory Compliance</td>
            <td className="px-3 py-3 border border-black align-top w-[75%]">
              <strong className="mb-2 block text-sm">Status: {d.compliance_status}</strong>
              {renderFormalContent(d.mandatory_compliance)}
            </td>
          </tr>
          <tr>
            <td className="px-3 py-3 border border-black font-bold bg-gray-50 align-top">Payment Terms</td>
            <td className="px-3 py-3 border border-black align-top">{renderFormalContent(d.payment_terms)}</td>
          </tr>
          <tr>
            <td className="px-3 py-3 border border-black font-bold bg-gray-50 align-top">Penalty & LD Clauses</td>
            <td className="px-3 py-3 border border-black align-top font-bold">{renderFormalContent(d.penalty_terms)}</td>
          </tr>
        </tbody>
      </table>

      {/* --- SECTION 5.0: CONSULTANT ADVICE --- */}
      <div style={{ pageBreakInside: 'avoid' }}>
        <h3 className="text-lg font-bold mb-2 border-b border-black pb-1 uppercase">5.0 Strategic Consultant Advice</h3>
        <div className="px-4 py-4 border-2 border-black bg-gray-50 text-left text-[13px]">
          {renderFormalContent(d.strategic_advice)}
        </div>
      </div>

      {/* --- FOOTER --- */}
      <div className="mt-8 pt-3 border-t border-black text-center text-[10px] font-mono uppercase tracking-widest">
        <p>*** Strictly Confidential - Internal Use Only - Aarvi Encon AI Engine ***</p>
        <p className="mt-1 text-gray-500">System generated report. Not for external circulation.</p>
      </div>

    </div>
  );
};

export default PrintableTenderReport;