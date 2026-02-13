'use client';

import { useTranslations, useLocale } from 'next-intl';
import { BookOpen, FileText, Zap, HelpCircle } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

export default function AdminHelpPage() {
  const t = useTranslations('common');
  const locale = useLocale();
  const [activeDoc, setActiveDoc] = useState<'quick-start' | 'user-guide' | null>(null);

  const isEnglish = locale === 'en';

  const documentLinks = [
    {
      id: 'quick-start' as const,
      title: t('quick_start'),
      description: isEnglish
        ? 'Get started in 5 minutes with essential admin features'
        : 'Start in 5 minuten met essentiële admin functies',
      icon: Zap,
      color: 'bg-green-500',
      pdfPath: isEnglish ? '/docs/quick-start.pdf' : '/docs/snel-starten.pdf',
      mdPath: isEnglish ? '/docs/quick-start.md' : '/docs/snel-starten.md',
    },
    {
      id: 'user-guide' as const,
      title: t('user_guide'),
      description: isEnglish
        ? 'Complete admin documentation with detailed instructions'
        : 'Volledige admin documentatie met gedetailleerde instructies',
      icon: BookOpen,
      color: 'bg-blue-500',
      pdfPath: isEnglish ? '/docs/user-guide.pdf' : '/docs/gebruikershandleiding.pdf',
      mdPath: isEnglish ? '/docs/user-guide.md' : '/docs/gebruikershandleiding.md',
    },
  ];

  const quickLinks = [
    {
      title: isEnglish ? 'Approve Commissions' : 'Commissies Goedkeuren',
      path: `/${locale}/admin/commissions`,
      icon: '✅',
    },
    {
      title: isEnglish ? 'Manage Users' : 'Gebruikers Beheren',
      path: `/${locale}/admin/users`,
      icon: '👥',
    },
    {
      title: isEnglish ? 'View Analytics' : 'Bekijk Analytics',
      path: `/${locale}/admin/analytics`,
      icon: '📊',
    },
    {
      title: isEnglish ? 'Auto-Approval Rules' : 'Auto-Goedkeuringsregels',
      path: `/${locale}/admin/settings/auto-approval`,
      icon: '⚙️',
    },
    {
      title: isEnglish ? 'Activity Dashboard' : 'Activiteitendashboard',
      path: `/${locale}/admin/activity`,
      icon: '🔍',
    },
    {
      title: isEnglish ? 'Audit Logs' : 'Auditlogboeken',
      path: `/${locale}/admin/audit-logs`,
      icon: '📋',
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
          {t('help')} - Admin
        </h1>
        <p className="mt-2 text-gray-600">
          {isEnglish
            ? 'Admin guides, documentation, and support resources'
            : 'Admin handleidingen, documentatie en ondersteuningsbronnen'}
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
          {isEnglish ? '⚡ Quick Admin Actions' : '⚡ Snelle Admin Acties'}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
      </div>

      {/* Admin FAQ Preview */}
      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {isEnglish ? '❓ Admin FAQs' : '❓ Admin Veelgestelde Vragen'}
        </h2>
        <div className="space-y-4">
          <details className="border-b border-gray-200 pb-4">
            <summary className="font-medium text-gray-900 cursor-pointer hover:text-blue-600">
              {isEnglish
                ? 'How do I set up auto-approval rules?'
                : 'Hoe stel ik auto-goedkeuringsregels in?'}
            </summary>
            <p className="mt-2 text-gray-600">
              {isEnglish
                ? 'Go to Settings > Auto-Approval > New Rule. Set amount limits, select trusted resellers, and assign priority.'
                : 'Ga naar Instellingen > Auto-Goedkeuring > Nieuwe Regel. Stel bedraglimieten in, selecteer vertrouwde resellers en wijs prioriteit toe.'}
            </p>
          </details>
          <details className="border-b border-gray-200 pb-4">
            <summary className="font-medium text-gray-900 cursor-pointer hover:text-blue-600">
              {isEnglish
                ? 'What happens when a commission is auto-approved?'
                : 'Wat gebeurt er als een commissie automatisch wordt goedgekeurd?'}
            </summary>
            <p className="mt-2 text-gray-600">
              {isEnglish
                ? 'The commission is marked as approved, logged in audit logs, and the reseller receives a notification.'
                : 'De commissie wordt gemarkeerd als goedgekeurd, vastgelegd in auditlogs en de reseller ontvangt een melding.'}
            </p>
          </details>
          <details className="border-b border-gray-200 pb-4">
            <summary className="font-medium text-gray-900 cursor-pointer hover:text-blue-600">
              {isEnglish
                ? 'How often should I check audit logs?'
                : 'Hoe vaak moet ik auditlogs controleren?'}
            </summary>
            <p className="mt-2 text-gray-600">
              {isEnglish
                ? 'Best practice is weekly checks. For sensitive operations or security concerns, review daily.'
                : 'Best practice is wekelijkse controles. Voor gevoelige operaties of beveiligingszorgen, dagelijks bekijken.'}
            </p>
          </details>
          <div className="pt-2">
            <p className="text-sm text-gray-500">
              {isEnglish
                ? 'See the full admin documentation for more FAQs and detailed guidance.'
                : 'Bekijk de volledige admin documentatie voor meer FAQ\'s en gedetailleerde begeleiding.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}