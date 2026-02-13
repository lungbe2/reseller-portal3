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
  FileText,
  Activity,
  Shield,
  ChevronDown,
  Globe,
  HelpCircle,
  Settings,
} from 'lucide-react';
import { useState } from 'react';
import { LanguageSwitcher } from '@/components/language-switcher';
import NotificationBell from '@/components/ui/notification-bell';

export default function AdminSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession() || {};
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [reportsExpanded, setReportsExpanded] = useState(true);
  const t = useTranslations('common');
  const tAdmin = useTranslations('admin');
  const locale = useLocale();
  const tAnalytics = useTranslations('analytics');
  const tUserManagement = useTranslations('user_management');

  const navigation = [
    { name: t('dashboard'), href: `/${locale}/admin/dashboard`, icon: LayoutDashboard },
    { name: t('resellers'), href: `/${locale}/admin/resellers`, icon: Users },
    { name: t('customers'), href: `/${locale}/admin/customers`, icon: Building2 },
    { name: t('commissions'), href: `/${locale}/admin/commissions`, icon: DollarSign },
    { name: t('documents'), href: `/${locale}/admin/documents`, icon: FileText },
    { name: tUserManagement('title'), href: `/${locale}/admin/users`, icon: UserCog },
    { name: t('settings'), href: `/${locale}/admin/settings`, icon: Settings },
    { name: t('help'), href: `/${locale}/admin/help`, icon: HelpCircle },
  ];

  const reportsMenu = [
    { name: tAnalytics('title'), href: `/${locale}/admin/analytics`, icon: BarChart3 },
    { name: t('activity_dashboard'), href: `/${locale}/admin/activity`, icon: Activity },
    { name: t('audit_logs'), href: `/${locale}/admin/audit-logs`, icon: Shield },
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
          <Link href={`/${locale}/admin/dashboard`} className="text-xl font-bold text-blue-600">
            {tAdmin('portal')}
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
          <Link href={`/${locale}/admin/dashboard`} className="text-xl font-bold text-blue-600">
            {tAdmin('portal')}
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-md text-gray-700 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 16rem)' }}>
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
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

          {/* Reports Section */}
          <div className="pt-2">
            <button
              onClick={() => setReportsExpanded(!reportsExpanded)}
              className="flex items-center justify-between w-full px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <BarChart3 className="h-5 w-5" />
                <span>Reports & Analytics</span>
              </div>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  reportsExpanded ? 'rotate-180' : ''
                }`}
              />
            </button>
            
            {reportsExpanded && (
              <div className="mt-1 space-y-1">
                {reportsMenu.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 pl-12 pr-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        {/* User Section */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{session?.user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{session?.user?.email}</p>
              <span className="inline-block mt-1 text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">Admin</span>
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
