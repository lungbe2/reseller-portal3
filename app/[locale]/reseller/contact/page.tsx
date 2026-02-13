import { Mail, Phone, MapPin } from 'lucide-react';
import { useTranslations } from 'next-intl';
import ContactForm from '../_components/contact-form';

export default function ContactPage() {
  const t = useTranslations('reseller');
  const tc = useTranslations('common');

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{t('contact_support')}</h1>
        <p className="mt-2 text-gray-600">{t('get_in_touch')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Contact Information */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">{t('contact_info')}</h2>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Mail className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{tc('email')}</h3>
                <p className="text-gray-600">support@resellerportal.com</p>
                <p className="text-sm text-gray-500 mt-1">{t('respond_within_24hrs')}</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Phone className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{tc('phone')}</h3>
                <p className="text-gray-600">+31 20 123 4567</p>
                <p className="text-sm text-gray-500 mt-1">{t('office_hours')}</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <MapPin className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{tc('office')}</h3>
                <p className="text-gray-600">Prinsengracht 123</p>
                <p className="text-gray-600">1015 LM Amsterdam</p>
                <p className="text-gray-600">Netherlands</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">{t('send_us_message')}</h2>
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
