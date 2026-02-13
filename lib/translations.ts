// Custom translation helper that doesn't require next-intl plugin
export async function getMessages(locale: string) {
  try {
    const messages = await import(`../messages/${locale}.json`);
    return messages.default;
  } catch (error) {
    // Fallback to English if locale not found
    const messages = await import(`../messages/en.json`);
    return messages.default;
  }
}

export function createTranslator(messages: any, namespace?: string) {
  return (key: string, values?: Record<string, any>) => {
    const keys = namespace ? `${namespace}.${key}`.split('.') : key.split('.');
    let value: any = messages;
    
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return key; // Return key if translation not found
      }
    }
    
    if (typeof value === 'string' && values) {
      // Simple placeholder replacement
      return value.replace(/\{(\w+)\}/g, (match, key) => {
        return values[key] !== undefined ? String(values[key]) : match;
      });
    }
    
    return value || key;
  };
}
