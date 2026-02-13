'use client';

import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import {
  LayoutDashboard,
  Users,
  DollarSign,
  Mail,
  LogOut,
  Menu,
  X,
  BarChart3,
  FileText,
  Bell,
  Globe,
  ChevronDown,
  HelpCircle,
  Settings,
} from 'lucide-react';
import { useState } from 'react';
import { LanguageSwitcher } from '@/components/language-switcher';
import NotificationBell from '@/components/ui/notification-bell';

export default function ResellerSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession() || {};
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const t = useTranslations('common');
  const tReseller = useTranslations('reseller');
  const locale = useLocale();
  const tAnalytics = useTranslations('analytics');

  const navigation = [
    { name: t('dashboard'), href: `/${locale}/reseller/dashboard`, icon: LayoutDashboard },
    { name: t('customers'), href: `/${locale}/reseller/customers`, icon: Users },
    { name: t('commissions'), href: `/${locale}/reseller/commissions`, icon: DollarSign },
    { name: tAnalytics('title'), href: `/${locale}/reseller/analytics`, icon: BarChart3 },
    { name: t('documents'), href: `/${locale}/reseller/documents`, icon: FileText },
    { name: t('settings'), href: `/${locale}/reseller/settings`, icon: Settings },
    { name: t('help'), href: `/${locale}/reseller/help`, icon: HelpCircle },
    { name: t('contact'), href: `/${locale}/reseller/contact`, icon: Mail },
  ];

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white shadow-sm z-40 h-16">
        <div className="flex items-center justify-between h-full px-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-md text-gray-700 hover:bg-gray-100"
          >
            <Menu className="h-6 w-6" />
          </button>
          <Link href={`/${locale}/reseller/dashboard`} className="text-xl font-bold text-blue-600">
            {tReseller('portal')}
          </Link>
          <div className="flex items-center gap-2">
            <NotificationBell />
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200">
          <Link href={`/${locale}/reseller/dashboard`} className="text-xl font-bold text-blue-600">
            {tReseller('portal')}
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-md text-gray-700 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{session?.user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{session?.user?.email}</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-2">
              <Globe className="h-4 w-4 text-gray-500" />
              <LanguageSwitcher />
            </div>
            
            <button
              onClick={() => signOut({ callbackUrl: `/${locale}/login` })}
              className="flex items-center gap-3 w-full px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              {t('logout')}
            </button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  );
}
