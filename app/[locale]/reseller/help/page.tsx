'use client';

import { useTranslations, useLocale } from 'next-intl';
import { BookOpen, FileText, Zap, HelpCircle } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

export default function HelpPage() {
  const t = useTranslations('common');
  const locale = useLocale();
  const [activeDoc, setActiveDoc] = useState<'quick-start' | 'user-guide' | null>(null);

  const isEnglish = locale === 'en';

  const documentLinks = [
    {
      id: 'quick-start' as const,
      title: t('quick_start'),
      description: isEnglish
        ? 'Get started in 5 minutes with essential features'
        : 'Start in 5 minuten met essentiële functies',
      icon: Zap,
      color: 'bg-green-500',
      pdfPath: isEnglish ? '/docs/quick-start.pdf' : '/docs/snel-starten.pdf',
      mdPath: isEnglish ? '/docs/quick-start.md' : '/docs/snel-starten.md',
    },
    {
      id: 'user-guide' as const,
      title: t('user_guide'),
      description: isEnglish
        ? 'Complete documentation with detailed instructions'
        : 'Volledige documentatie met gedetailleerde instructies',
      icon: BookOpen,
      color: 'bg-blue-500',
      pdfPath: isEnglish ? '/docs/user-guide.pdf' : '/docs/gebruikershandleiding.pdf',
      mdPath: isEnglish ? '/docs/user-guide.md' : '/docs/gebruikershandleiding.md',
    },
  ];

  const quickLinks = [
    {
      title: isEnglish ? 'Add Customer' : 'Klant Toevoegen',
      path: `/${locale}/reseller/customers`,
      icon: '👥',
    },
    {
      title: isEnglish ? 'Request Commission' : 'Commissie Aanvragen',
      path: `/${locale}/reseller/commissions`,
      icon: '💰',
    },
    {
      title: isEnglish ? 'View Analytics' : 'Bekijk Analytics',
      path: `/${locale}/reseller/analytics`,
      icon: '📊',
    },
    {
      title: isEnglish ? 'Upload Document' : 'Document Uploaden',
      path: `/${locale}/reseller/documents`,
      icon: '📄',
    },
  ];

  const contactInfo = {
    email: 'support@medici-holding.com',
    phone: '+31 (0)20 123 4567',
    hours: isEnglish ? 'Mon-Fri: 9:00 - 17:00 CET' : 'Ma-Vr: 9:00 - 17:00 CET',
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <HelpCircle className="h-8 w-8 text-blue-600" />
          {t('help')}
        </h1>
        <p className="mt-2 text-gray-600">
          {isEnglish
            ? 'Find guides, documentation, and support resources'
            : 'Vind handleidingen, documentatie en ondersteuningsbronnen'}
        </p>
      </div>

      {/* Documentation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {documentLinks.map((doc) => {
          const Icon = doc.icon;
          return (
            <div
              key={doc.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${doc.color}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    {doc.title}
                  </h2>
                  <p className="text-gray-600 mb-4">{doc.description}</p>
                  <div className="flex gap-3">
                    <a
                      href={doc.pdfPath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      {isEnglish ? 'View PDF' : 'Bekijk PDF'}
                    </a>
                    <a
                      href={doc.mdPath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      {isEnglish ? 'View Markdown' : 'Bekijk Markdown'}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Links */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {isEnglish ? '⚡ Quick Actions' : '⚡ Snelle Acties'}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickLinks.map((link) => (
            <Link
              key={link.path}
              href={link.path}
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
            >
              <span className="text-2xl">{link.icon}</span>
              <span className="font-medium text-gray-900">{link.title}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Contact Support */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-md p-6 text-white">
        <h2 className="text-xl font-semibold mb-4">
          {isEnglish ? '💬 Need More Help?' : '💬 Meer Hulp Nodig?'}
        </h2>
        <p className="mb-4">
          {isEnglish
            ? "Can't find what you're looking for? Our support team is here to help!"
            : 'Kunt u niet vinden wat u zoekt? Ons supportteam helpt u graag!'}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <div className="font-semibold mb-1">📧 {isEnglish ? 'Email' : 'E-mail'}</div>
            <a
              href={`mailto:${contactInfo.email}`}
              className="text-blue-100 hover:text-white underline"
            >
              {contactInfo.email}
            </a>
          </div>
          <div>
            <div className="font-semibold mb-1">📱 {isEnglish ? 'Phone' : 'Telefoon'}</div>
            <a
              href={`tel:${contactInfo.phone}`}
              className="text-blue-100 hover:text-white"
            >
              {contactInfo.phone}
            </a>
          </div>
          <div>
            <div className="font-semibold mb-1">🕐 {isEnglish ? 'Hours' : 'Openingstijden'}</div>
            <div className="text-blue-100">{contactInfo.hours}</div>
          </div>
        </div>
        <Link
          href={`/${locale}/reseller/contact`}
          className="inline-flex items-center px-6 py-3 bg-white text-blue-600 rounded-md font-semibold hover:bg-blue-50 transition-colors"
        >
          {isEnglish ? 'Contact Support' : 'Neem Contact Op'}
        </Link>
      </div>

      {/* FAQ Preview */}
      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {isEnglish ? '❓ Frequently Asked Questions' : '❓ Veelgestelde Vragen'}
        </h2>
        <div className="space-y-4">
          <details className="border-b border-gray-200 pb-4">
            <summary className="font-medium text-gray-900 cursor-pointer hover:text-blue-600">
              {isEnglish ? 'How do I request a commission?' : 'Hoe vraag ik een commissie aan?'}
            </summary>
            <p className="mt-2 text-gray-600">
              {isEnglish
                ? 'Go to Commissions > Request Commission, fill in the form with customer and amount, then submit.'
                : 'Ga naar Commissies > Commissie Aanvragen, vul het formulier in met klant en bedrag, en dien in.'}
            </p>
          </details>
          <details className="border-b border-gray-200 pb-4">
            <summary className="font-medium text-gray-900 cursor-pointer hover:text-blue-600">
              {isEnglish
                ? 'How long does commission approval take?'
                : 'Hoe lang duurt commissiegoedkeuring?'}
            </summary>
            <p className="mt-2 text-gray-600">
              {isEnglish
                ? 'Trusted resellers with small commissions may be auto-approved instantly. Otherwise, approval time depends on admin review.'
                : 'Vertrouwde resellers met kleine commissies kunnen direct automatisch worden goedgekeurd. Anders hangt de goedkeuringstijd af van admin review.'}
            </p>
          </details>
          <details className="border-b border-gray-200 pb-4">
            <summary className="font-medium text-gray-900 cursor-pointer hover:text-blue-600">
              {isEnglish ? 'Can I export my data?' : 'Kan ik mijn data exporteren?'}
            </summary>
            <p className="mt-2 text-gray-600">
              {isEnglish
                ? 'Yes! Most pages have an "Export" button that downloads data as CSV.'
                : 'Ja! De meeste pagina\'s hebben een "Exporteren" knop die data downloadt als CSV.'}
            </p>
          </details>
          <div className="pt-2">
            <p className="text-sm text-gray-500">
              {isEnglish
                ? 'See the full documentation for more FAQs and detailed answers.'
                : 'Bekijk de volledige documentatie voor meer FAQ\'s en gedetailleerde antwoorden.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}