import React from 'react';
import type { LoanApplicationData } from './types';

interface PrintableApplicationFormProps {
  applicationToView?: LoanApplicationData | null;
}

const PrintableApplicationForm = React.forwardRef<HTMLDivElement, PrintableApplicationFormProps>(
  ({ applicationToView }, ref) => {

    const getValue = (key: keyof LoanApplicationData, fallback: string | number = 'N/A') => {
      const value = applicationToView?.[key];
      if (value === null || value === undefined || value === '') {
        return fallback;
      }
      return String(value);
    };

    const formatDate = (dateValue?: any) => {
      if (!dateValue) return 'N/A';
      try {
        const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue.toDate();
        if (isNaN(date.getTime())) return 'N/A';
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      } catch (e) {
        return 'N/A';
      }
    };
    
    const DetailRow = ({ label, value }: { label: string, value: React.ReactNode }) => (
        <tr>
            <td className="label-cell">{label}</td>
            <td className="value-cell">{value}</td>
        </tr>
    );

    return (
      <div ref={ref} className="printable-content">
        <style>{`
          .printable-content {
            font-family: 'Inter', sans-serif; /* Use Inter font */
            font-size: 11pt; /* Adjusted font size */
            line-height: 1.3; /* Adjusted line height for readability */
            background-color: #fff;
            color: #000;
            word-spacing: normal; /* Ensure proper word spacing */
            padding: 1cm; /* Mimic A4 margins */
            box-sizing: border-box;
            width: 21cm; /* A4 width */
            margin: 0 auto; /* Center content */
          }
          
          /* Headers */
          .header { text-align: center; margin-bottom: 15px; }
          .header h1 { font-size: 18pt; font-weight: bold; margin: 0; padding:0; }
          .header p { font-size: 8pt; margin: 0; padding:0; line-height: 1.2; }

          /* Form Header (Customer Application Form title and photo box) */
          .form-header-grid { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
          .form-title-section { flex: 3; padding-right: 10px; } /* Adjust flex for spacing */
          .photo-box-section { flex: 1; display: flex; justify-content: flex-end; }
          
          .form-title { 
            text-align: center; 
            font-weight: bold; 
            font-size: 14pt; 
            margin: 8px 0; 
            border-top: 0.5pt solid #000; /* Thin border */
            border-bottom: 0.5pt solid #000; /* Thin border */
            padding: 4px 0; 
            word-spacing: normal; /* Ensure no jumbling */
          }
          .app-id { text-align: center; font-size: 10pt; word-spacing: normal; }
          .photo-box { 
            height: 110px; 
            width: 90px; 
            border: 0.5pt solid #000; /* Thin border */
            display: flex; 
            align-items: center; 
            justify-content: center; 
            text-align: center; 
            font-size: 9pt; 
            color: #888; 
            line-height: 1.2;
            word-spacing: normal;
          }
          
          /* Sections (Personal Details, Occupation, etc.) */
          .section { margin-bottom: 10mm; page-break-inside: avoid; } /* Ensure sections stay together */
          .section-title { 
            font-weight: bold; 
            font-size: 11pt; 
            margin-top: 10px; 
            margin-bottom: 4px; 
            padding: 4px; 
            background-color: #e5e7eb; 
            border-top: 0.5pt solid #000; /* Thin border */
            border-bottom: 0.5pt solid #000; /* Thin border */
            word-spacing: normal;
          }
          
          /* Data Tables */
          .data-table { width: 100%; border-collapse: collapse; border: none; } /* Remove outer border */
          .data-table td { 
            border: 0.5pt solid #000; /* Thin border for cells */
            padding: 4px 6px; /* Adjusted padding */
            vertical-align: top; 
            font-size: 10pt; /* Slightly smaller text in tables */
            line-height: 1.2; /* Tighter line height in tables */
            word-spacing: normal;
          }
          .label-cell { width: 30%; font-weight: bold; background-color: #f9fafb; }
          .value-cell { width: 70%; }

          /* Signatures */
          .signatures-section { 
            margin-top: 15mm; 
            display: flex; 
            justify-content: space-between; 
            page-break-inside: avoid; /* Keep signatures together */
            word-spacing: normal;
          }
          .signature-box { width: 30%; text-align: center; font-size: 9pt; }
          .signature-line { border-top: 0.5pt solid #000; padding-top: 5px; margin-top: 40px; } /* Thin border */
        `}</style>
        
        <div className="header">
          <h1>SHAGUNAM MICRO ASSOCIATION</h1>
          <p>(Incorporated under the Companies Act, 2013)</p>
          <p>Registered by Ministry of Corporate Affairs, Govt. of India | CIN: U88100BR2024NPL071641</p>
          <p>Add: Kumhar Tola Ps Tarapur, Munger, Tarapur (munger), Munger, Tarapur, Bihar, India, 813221.</p>
          <p>Email: nayansingh569@gmail.com, Contact: +91 98352 71957</p>
        </div>

        <div className="form-header-grid">
            <div className="form-title-section">
                <h2 className="form-title">CUSTOMER APPLICATION FORM</h2>
                <p className="app-id">Application ID: {getValue('id')}</p>
            </div>
            <div className="photo-box-section">
                <div className="photo-box">Affix Recent Photograph</div>
            </div>
        </div>

        <div className="section">
            <h3 className="section-title">1. Personal Details (व्यक्तिगत जानकारी)</h3>
            <table className="data-table">
            <tbody>
                <DetailRow label="Customer Name" value={<>{getValue('customerName')} / {getValue('customerNameHindi')}</>} />
                <DetailRow label="Father's Name" value={<>{getValue('fatherName')} / {getValue('fatherNameHindi')}</>} />
                <DetailRow label="Mother's Name" value={<>{getValue('motherName')} / {getValue('motherNameHindi')}</>} />
                <DetailRow label="Spouse's Name" value={<>{getValue('husbandWifeName', 'N/A')} / {getValue('husbandWifeNameHindi', 'N/A')}</>} />
                <DetailRow label="Date of Birth / Gender" value={<>{formatDate(getValue('dateOfBirth'))} / {getValue('gender')}</>} />
                <DetailRow label="Mobile / Alternate Mobile" value={<>{getValue('mobileNumber')} / {getValue('alternateMobileNumber', 'N/A')}</>} />
                <DetailRow label="Residential Address" value={<>{getValue('residentialAddress')} / {getValue('residentialAddressHindi')}</>} />
                <DetailRow label="City / Pincode" value={<>{getValue('city')} ({getValue('cityHindi')}) / {getValue('pincode')} ({getValue('pincodeHindi')})</>} />
                <DetailRow label="State / Branch" value={<>{getValue('state')} ({getValue('stateHindi')}) / {getValue('assignedBranchCode')}</>} />
                <DetailRow label="Permanent Address" value={<>{getValue('permanentAddress')} / {getValue('permanentAddressHindi')}</>} />
            </tbody>
            </table>
        </div>
        
        <div className="section">
            <h3 className="section-title">2. Occupation & Income (व्यवसाय और आय)</h3>
            <table className="data-table">
            <tbody>
                <DetailRow label="Company/Shop Name" value={getValue('companyShopName')} />
                <DetailRow label="Company/Shop Address" value={getValue('companyShopAddress')} />
                <DetailRow label="Annual / Monthly Income" value={<>₹{getValue('annualIncome')} / ₹{getValue('monthlyIncome')}</>} />
            </tbody>
            </table>
        </div>

        <div className="section">
            <h3 className="section-title">3. Loan Details (ऋण विवरण)</h3>
            <table className="data-table">
            <tbody>
                <DetailRow label="Loan Amount Required / Sanctioned" value={<>₹{getValue('loanAmountRequired')} / ₹{getValue('loanAmountApproved', getValue('loanAmountRequired'))}</>} />
                <DetailRow label="Loan Scheme / Type" value={<>{getValue('loanScheme')} / {getValue('loanType')}</>} />
                <DetailRow label="Interest Rate / Processing Fee" value={<>{`${getValue('interestRate', '0')}%`} / ₹{getValue('processingFee', '0')}</>} />
                <DetailRow label="Repayment Type / Tenure Period" value={<>{getValue('repaymentType')} / {`${getValue('tenurePeriod')} ${getValue('repaymentType') === 'Daily' ? 'Days' : getValue('repaymentType') === 'Weekly' ? 'Weeks' : 'Months'}`}</>} />
                <DetailRow label="Calculated EMI / Late Fine" value={<>₹{getValue('repaymentType') === 'Daily' ? getValue('dailyEMI') : getValue('repaymentType') === 'Weekly' ? getValue('weeklyEMI') : getValue('monthlyEMI')} / ₹{getValue('lateFine', '0')}</>} />
                <DetailRow label="Security for Loan" value={getValue('securityForLoan')} />
                <DetailRow label="Loan Approval Date" value={formatDate(getValue('approvalDate'))} />
            </tbody>
            </table>
        </div>

        <div className="section">
            <h3 className="section-title">4. Documents Submitted (दस्तावेज़)</h3>
            <table className="data-table">
            <tbody>
                <DetailRow label="Identity Document" value={`${getValue('identityDocumentType')} - ${getValue('identityDocumentNumber')}`} />
                <DetailRow label="Address Proof" value={`${getValue('addressProofDocumentType')} - ${getValue('addressProofDocumentNumber')}`}/>
            </tbody>
            </table>
        </div>

        <div className="section">
            <h3 className="section-title">5. Guarantor Details (जमानतकर्ता विवरण)</h3>
            <table className="data-table">
            <tbody>
                <DetailRow label="Guarantor Name" value={getValue('guarantorName')} />
                <DetailRow label="Guarantor Mobile" value={getValue('guarantorMobileNumber')} />
                <DetailRow label="Guarantor Document" value={`${getValue('guarantorDocumentType')} - ${getValue('guarantorDocumentNumber')}`}/>
                <DetailRow label="Guarantor Address" value={getValue('guarantorAddress')} />
            </tbody>
            </table>
        </div>

        <div className="signatures-section">
            <div className="signature-box"><div className="signature-line">Guarantor's Signature</div></div>
            <div className="signature-box"><div className="signature-line">Applicant's Signature</div></div>
            <div className="signature-box"><div className="signature-line">For SHAGUNAM MICRO ASSOCIATION</div></div>
        </div>
      </div>
    );
  }
);

PrintableApplicationForm.displayName = 'PrintableApplicationForm';

export default PrintableApplicationForm;
