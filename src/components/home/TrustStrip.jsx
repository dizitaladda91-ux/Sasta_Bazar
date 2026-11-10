import React from 'react';
import { Truck, ShieldCheck, Headphones, RefreshCw } from 'lucide-react';

export default function TrustStrip() {
  const trustFeatures = [
    {
      icon: Truck,
      title: 'FAST SHIPPING',
      subtitle: 'Tracked delivery across the UK & internationally'
    },
    {
      icon: ShieldCheck,
      title: 'SECURE PAYMENT',
      subtitle: '100% encrypted checkout with Apple Pay, Visa, Klarna'
    },
    {
      icon: null,
      title: 'PREMIUM QUALITY',
      subtitle: 'Rigorous fabric inspection & authentic ethnic detailing'
    },
    {
      icon: Headphones,
      title: '24/7 SUPPORT',
      subtitle: 'Dedicated styling & order support via email & DM'
    }
  ];

  return (
    <section className="bg-sasta-yellow-light/80 border-y border-sasta-border py-10 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {trustFeatures.map((feat, index) => {
            const Icon = feat.icon;
            return (
              <div
                key={index}
                className="flex items-center gap-4 p-3 bg-white/70 rounded-lg border border-sasta-border/70 shadow-2xs hover:bg-white transition-colors"
              >
                {Icon && (
                  <div className="w-12 h-12 rounded-full bg-sasta-yellow-soft flex items-center justify-center shrink-0 text-sasta-gold-dark border border-sasta-border">
                    <Icon className="w-6 h-6" />
                  </div>
                )}
                <div>
                  <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-sasta-heading">
                    {feat.title}
                  </h4>
                  <p className="text-[11px] text-sasta-body mt-0.5 leading-snug">
                    {feat.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
