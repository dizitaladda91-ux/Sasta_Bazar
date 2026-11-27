import React, { useMemo } from 'react';
import { Phone } from 'lucide-react';

export const COUNTRY_CODES = [
  { code: '+44', label: 'UK (+44)' },
  { code: '+91', label: 'India (+91)' },
  { code: '+1', label: 'US / Canada (+1)' },
  { code: '+971', label: 'UAE (+971)' },
  { code: '+92', label: 'Pakistan (+92)' },
  { code: '+880', label: 'Bangladesh (+880)' },
  { code: '+966', label: 'Saudi Arabia (+966)' },
  { code: '+61', label: 'Australia (+61)' },
  { code: '+49', label: 'Germany (+49)' },
  { code: '+33', label: 'France (+33)' },
  { code: '+65', label: 'Singapore (+65)' },
  { code: '+60', label: 'Malaysia (+60)' },
  { code: '+27', label: 'South Africa (+27)' },
  { code: '+234', label: 'Nigeria (+234)' },
  { code: '+254', label: 'Kenya (+254)' }
];

function splitPhoneValue(value) {
  const raw = String(value || '').trim();
  if (!raw) return { code: '+44', number: '' };

  const sortedCodes = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);
  for (const item of sortedCodes) {
    if (raw.startsWith(item.code)) {
      return {
        code: item.code,
        number: raw.slice(item.code.length).trim()
      };
    }
  }
  return { code: '+44', number: raw };
}

export default function PhoneInput({
  value,
  onChange,
  placeholder = 'Enter phone number',
  inputClassName = 'py-2.5 text-sm bg-white',
  selectClassName = 'py-2.5 text-xs bg-sasta-yellow-cream/40'
}) {
  const { code, number } = useMemo(() => splitPhoneValue(value), [value]);

  const handleCodeChange = (nextCode) => {
    onChange(number ? `${nextCode} ${number}` : nextCode);
  };

  const handleNumberChange = (nextNumber) => {
    const cleaned = nextNumber.replace(/[^\d\s-]/g, '');
    onChange(cleaned ? `${code} ${cleaned}` : '');
  };

  return (
    <div className="flex items-stretch rounded-lg border border-sasta-border overflow-hidden focus-within:border-sasta-gold transition-colors bg-white">
      <select
        aria-label="Country code"
        value={code}
        onChange={(e) => handleCodeChange(e.target.value)}
        className={`shrink-0 border-r border-sasta-border px-2.5 font-semibold text-sasta-heading focus:outline-none ${selectClassName}`}
      >
        {COUNTRY_CODES.map((item) => (
          <option key={item.code} value={item.code}>
            {item.label}
          </option>
        ))}
      </select>
      <div className="relative flex-1">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sasta-muted">
          <Phone className="h-3.5 w-3.5" />
        </div>
        <input
          type="tel"
          value={number}
          onChange={(e) => handleNumberChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full pl-9 pr-3 text-sasta-heading focus:outline-none ${inputClassName}`}
        />
      </div>
    </div>
  );
}
