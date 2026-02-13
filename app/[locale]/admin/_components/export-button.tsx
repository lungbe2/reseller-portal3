'use client';

import { useState } from 'react';
import { Download, FileSpreadsheet } from 'lucide-react';

interface ExportButtonProps {
  type: 'resellers' | 'customers';
  format?: 'summary' | 'detailed';
  label?: string;
}

export default function ExportButton({ type, format = 'summary', label }: ExportButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const url = format === 'detailed' 
        ? `/api/export/${type}?format=detailed`
        : `/api/export/${type}`;
      const response = await fetch(url);
      if (response.ok) {
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        const filename = format === 'detailed'
          ? `${type}_with_customers_${new Date().toISOString().split('T')[0]}.csv`
          : `${type}_${new Date().toISOString().split('T')[0]}.csv`;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(blobUrl);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const buttonLabel = label || (format === 'detailed' ? 'Export with Details' : 'Export to CSV');
  const Icon = format === 'detailed' ? FileSpreadsheet : Download;

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
    >
      <Icon className="h-4 w-4" />
      {loading ? 'Exporting...' : buttonLabel}
    </button>
  );
}
