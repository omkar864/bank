
// File: BilingualForm.tsx
'use client';

// Removed: import { ITRANS_to_Devanagari } from 'indic-transliteration';
import { useState, useCallback } from 'react';

export default function BilingualForm() {
  const [englishInput, setEnglishInput] = useState('');
  const [hindiInput, setHindiInput] = useState('');

  // Mock transliteration map (very basic for demonstration)
  const transliterationMap: Record<string, string> = {
    'nayan': 'नयन',
    'rahul': 'राहुल',
    'priya': 'प्रिया',
    'amit': 'अमित',
    'sunita': 'सुनीता',
    'kumar': 'कुमार',
    'sharma': 'शर्मा',
    'singh': 'सिंह',
    'patel': 'पटेल',
    'omkar': 'ओंकार',
  };

  const mockTransliterate = (text: string): string => {
    if (!text || text.trim() === '') {
      return '';
    }
    const lowerText = text.toLowerCase();
    if (transliterationMap[lowerText]) {
      return transliterationMap[lowerText];
    }
    return `${text} (हिन्दी)`; // Fallback for mock
  };

  const handleEnglishChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEnglishInput(value);
    // Use mock transliteration instead of the library
    setHindiInput(mockTransliterate(value));
  }, [transliterationMap]); // Added map to dependency array, though it's stable here

  const handleHindiChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setHindiInput(e.target.value); // manual override allowed
  }, []);

  return (
    <div className="p-6 max-w-xl mx-auto bg-card text-card-foreground rounded-xl shadow-md space-y-4 border">
      <h2 className="text-xl font-bold text-foreground">Bilingual Input Form (Using Mock Transliteration)</h2>
      <p className="text-sm text-muted-foreground">
        This form uses a basic mock for English to Hindi transliteration
        as the 'indic-transliteration' library could not be installed.
      </p>

      <div>
        <label htmlFor="english-name" className="block mb-1 text-sm font-medium text-foreground">Name (English)</label>
        <input
          id="english-name"
          type="text"
          value={englishInput}
          onChange={handleEnglishChange}
          className="w-full border border-input bg-background text-foreground rounded p-2 focus:ring-ring focus:ring-2"
          placeholder="e.g., Ravi Kumar"
        />
      </div>

      <div>
        <label htmlFor="hindi-name" className="block mb-1 text-sm font-medium text-foreground">नाम (Hindi)</label>
        <input
          id="hindi-name"
          type="text"
          value={hindiInput}
          onChange={handleHindiChange}
          className="w-full border border-input bg-background text-foreground rounded p-2 focus:ring-ring focus:ring-2"
          placeholder="स्वतः हिंदी में भर जाएगा (Autofills in Hindi)"
        />
      </div>
       <div className="mt-4 p-4 border border-dashed rounded-md bg-muted/50">
        <h3 className="text-md font-semibold text-muted-foreground">Notes on Mock Transliteration:</h3>
        <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1 mt-2">
          <li>Only a few names (like Nayan, Omkar, Rahul) are in the mock map.</li>
          <li>Other inputs will have " (हिन्दी)" appended.</li>
          <li>This is a client-side mock and does not use any external library.</li>
        </ul>
      </div>
    </div>
  );
}
