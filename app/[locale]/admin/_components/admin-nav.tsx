'use client';

import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import {
  LayoutDashboard,
  Users,
  Building2,
  DollarSign,
  LogOut,
  Menu,
  X,
  BarChart3,
  UserCog,
  Settings,
  FileText,
  Activity,
  Shield,
  ChevronDown,
} from 'lucide-react';
import { useState } from 'react';
import { LanguageSwitcher } from '@/components/language-switcher';
import NotificationBell from '@/components/ui/notification-bell';

export default function AdminNav() {
  const pathname = usePathname();
  const { data: session } = useSession() || {};
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [reportsDropdownOpen, setReportsDropdownOpen] = useState(false);
  const t = useTranslations('common');
  const tAdmin = useTranslations('admin');
  const locale = useLocale();

  const tAnalytics = useTranslations('analytics');
  const tUserManagement = useTranslations('user_management');
  const tSystemSettings = useTranslations('system_settings');

  const tOrganizations = useTranslations('organizations');

  const navigation = [
    { name: t('dashboard'), href: `/${locale}/admin/dashboard`, icon: LayoutDashboard },
    { name: tOrganizations('title'), href: `/${locale}/admin/organizations`, icon: Building2 },
    { name: t('resellers'), href: `/${locale}/admin/resellers`, icon: Users },
    { name: t('customers'), href: `/${locale}/admin/customers`, icon: Building2 },
    { name: t('commissions'), href: `/${locale}/admin/commissions`, icon: DollarSign },
    { name: t('documents'), href: `/${locale}/admin/documents`, icon: FileText },
    { name: tUserManagement('title'), href: `/${locale}/admin/users`, icon: UserCog },
  ];

  const reportsMenu = [
    { name: tAnalytics('title'), href: `/${locale}/admin/analytics`, icon: BarChart3 },
    { name: t('activity_dashboard'), href: `/${locale}/admin/activity`, icon: Activity },
    { name: t('audit_logs'), href: `/${locale}/admin/audit-logs`, icon: Shield },
  ];

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href={`/${locale}/admin/dashboard`} className="text-2xl font-bold text-blue-600">
                {tAdmin('portal')}
              </Link>
            </div>
            <div className="hidden md:ml-8 md:flex md:space-x-2 md:items-center">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                      isActive
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
              
              {/* Reports & Analytics Dropdown */}
              <div className="relative" style={{ marginRight: '1.5rem' }}>
                <button
                  onClick={() => setReportsDropdownOpen(!reportsDropdownOpen)}
                  onBlur={() => setTimeout(() => setReportsDropdownOpen(false), 200)}
                  title="Reports & Analytics"
                  className={`inline-flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                    reportsMenu.some(item => pathname === item.href || pathname?.startsWith(item.href + '/'))
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <BarChart3 className="h-4 w-4" />
                  <ChevronDown className={`h-4 w-4 transition-transform ${reportsDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {reportsDropdownOpen && (
                  <div className="absolute left-0 mt-1 w-56 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                    {reportsMenu.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                            isActive
                              ? 'bg-blue-50 text-blue-600'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                          onClick={() => setReportsDropdownOpen(false)}
                        >
                          <Icon className="h-4 w-4" />
                          {item.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="hidden md:flex md:items-center md:gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-700 whitespace-nowrap">
              <span className="font-medium">{session?.user?.name}</span>
              <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">Admin</span>
            </div>
            <NotificationBell />
            <LanguageSwitcher />
            <button
              onClick={() => signOut({ callbackUrl: `/${locale}/login` })}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              {t('logout')}
            </button>
          </div>
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-gray-700 hover:bg-gray-100"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
            
            {/* Reports Menu Items */}
            <div className="pt-2 pb-1">
              <div className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Reports & Analytics
              </div>
              {reportsMenu.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium ${
                      isActive
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="px-4 mb-3 text-sm text-gray-700">
              <span className="font-medium">{session?.user?.name}</span>
              <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">Admin</span>
            </div>
            <div className="px-4 mb-3">
              <LanguageSwitcher />
            </div>
            <button
              onClick={() => signOut({ callbackUrl: `/${locale}/login` })}
              className="flex items-center gap-2 w-full px-3 py-2 mx-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
            >
              <LogOut className="h-5 w-5" />
              {t('logout')}
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
