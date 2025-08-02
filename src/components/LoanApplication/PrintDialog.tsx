'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Loader2, Download } from 'lucide-react';
import PrintableApplicationForm from './PrintableApplicationForm'; 
import PrintableLoanAgreement from './PrintableLoanAgreement'; 
import type { LoanApplicationData } from './LoanApplication'; 

interface PrintDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  applicationToView?: LoanApplicationData | null;
  documentType: 'application' | 'agreement'; 
}

const PrintDialog = ({ isOpen, onOpenChange, applicationToView, documentType }: PrintDialogProps) => {
  const printableComponentRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleDownloadPdf = async () => {
    if (!printableComponentRef.current) {
      console.error("Printable component ref is not available.");
      return;
    }

    setIsGeneratingPdf(true);

    try {
      // The printable form now contains its own styling, so we don't need to apply temporary styles here.
      const canvas = await html2canvas(printableComponentRef.current, {
        scale: 3, // Increased scale for even higher resolution (experiment with 2 or 3)
        useCORS: true, 
        logging: true,
        // Ensure html2canvas captures the full scrollable content
        windowWidth: printableComponentRef.current.scrollWidth,
        windowHeight: printableComponentRef.current.scrollHeight,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4'); // 'p' for portrait, 'mm' for millimeters, 'a4' for A4 size

      const pdfWidth = pdf.internal.pageSize.getWidth(); // 210 mm
      const pdfHeight = pdf.internal.pageSize.getHeight(); // 297 mm

      // Calculate image dimensions to fit PDF width while maintaining aspect ratio
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0; // Starting Y position on the PDF page

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;

      // Add subsequent pages if content overflows
      while (heightLeft > 0) {
        position = - (imgHeight - heightLeft); // Calculate new position for the next part of the image
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      const filename = documentType === 'application'
        ? (applicationToView?.id ? `LoanApplication_${applicationToView.id}.pdf` : `LoanApplication_${new Date().toISOString().split('T')[0]}.pdf`)
        : (applicationToView?.id ? `LoanAgreement_${applicationToView.id}.pdf` : `LoanAgreement_${new Date().toISOString().split('T')[0]}.pdf`);
      
      pdf.save(filename);
      console.log("PDF generated and saved successfully.");

    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>
            {documentType === 'application' ? 'Print Application Form' : 'Print Loan Agreement'}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-grow overflow-auto bg-gray-50 p-4">
          <div className="bg-white p-6 shadow-md rounded-md">
            {documentType === 'application' ? (
              <PrintableApplicationForm ref={printableComponentRef} applicationToView={applicationToView} />
            ) : (
              <PrintableLoanAgreement ref={printableComponentRef} applicationToView={applicationToView} />
            )}
          </div>
        </div>
        <DialogFooter className="p-4 border-t flex justify-end">
          <Button onClick={() => onOpenChange(false)} variant="outline">Close</Button>
          <Button onClick={handleDownloadPdf} disabled={isGeneratingPdf}>
            {isGeneratingPdf ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            {isGeneratingPdf ? 'Generating PDF...' : 'Download PDF'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PrintDialog;
