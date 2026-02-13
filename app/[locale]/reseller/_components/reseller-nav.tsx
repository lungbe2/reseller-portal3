'use client';

import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  DollarSign,
  Mail,
  LogOut,
  Menu,
  X,
  BarChart3,
  FileText,
} from 'lucide-react';
import { useState } from 'react';
import { LanguageSwitcher } from '@/components/language-switcher';
import NotificationBell from '@/components/ui/notification-bell';

export default function ResellerNav() {
  const pathname = usePathname();
  const { data: session } = useSession() || {};
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = useTranslations('common');
  const tReseller = useTranslations('reseller');
  const locale = useLocale();

  const tAnalytics = useTranslations('analytics');

  const navigation = [
    { name: t('dashboard'), href: `/${locale}/reseller/dashboard`, icon: LayoutDashboard },
    { name: t('customers'), href: `/${locale}/reseller/customers`, icon: Users },
    { name: t('referrals'), href: `/${locale}/reseller/referrals`, icon: UserPlus },
    { name: t('commissions'), href: `/${locale}/reseller/commissions`, icon: DollarSign },
    { name: tAnalytics('title'), href: `/${locale}/reseller/analytics`, icon: BarChart3 },
    { name: t('documents'), href: `/${locale}/reseller/documents`, icon: FileText },
    { name: t('contact'), href: `/${locale}/reseller/contact`, icon: Mail },
  ];

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href={`/${locale}/reseller/dashboard`} className="text-2xl font-bold text-blue-600">
                {tReseller('portal')}
              </Link>
            </div>
            <div className="hidden md:ml-8 md:flex md:space-x-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
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
            </div>
          </div>
          <div className="hidden md:flex md:items-center md:gap-4">
            <div className="text-sm text-gray-700">
              <span className="font-medium">{session?.user?.name}</span>
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
              const isActive = pathname === item.href;
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
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="px-4 mb-3 text-sm text-gray-700">
              <span className="font-medium">{session?.user?.name}</span>
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
