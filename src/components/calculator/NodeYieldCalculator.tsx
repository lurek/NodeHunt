import React, { useState, useId } from 'react';

interface HardwareProfile {
  id: string;
  name: string;
  category: 'GPU Enterprise' | 'GPU Consumer' | 'Apple Silicon' | 'Edge / Bandwidth';
  powerWatts: number;
  monthlyRevenueEst: number;
  protocols: string[];
  recommendation: string;
}

const HARDWARE_PRESETS: HardwareProfile[] = [
  {
    id: 'h100',
    name: 'NVIDIA H100 80GB SXM5',
    category: 'GPU Enterprise',
    powerWatts: 700,
    monthlyRevenueEst: 850,
    protocols: ['io.net', 'Akash Network'],
    recommendation: 'Prime candidate for foundation model training and high-tier Ray clusters.',
  },
  {
    id: 'a100',
    name: 'NVIDIA A100 80GB PCIe',
    category: 'GPU Enterprise',
    powerWatts: 300,
    monthlyRevenueEst: 420,
    protocols: ['io.net', 'Akash Network'],
    recommendation: 'Optimal for mid-tier enterprise LLM fine-tuning and batch inference.',
  },
  {
    id: 'rtx4090',
    name: 'NVIDIA RTX 4090 (24GB VRAM)',
    category: 'GPU Consumer',
    powerWatts: 380,
    monthlyRevenueEst: 110,
    protocols: ['io.net', 'Bittensor (SN1/SN19)', 'Akash'],
    recommendation: 'The gold standard for consumer AI inference and quantized LLM serving.',
  },
  {
    id: 'rtx3080',
    name: 'NVIDIA RTX 3080 (10GB VRAM)',
    category: 'GPU Consumer',
    powerWatts: 320,
    monthlyRevenueEst: 38,
    protocols: ['io.net (Inference)', 'Livepeer Transcoding'],
    recommendation: 'Solid for video transcoding pipelines and lightweight inference tasks.',
  },
  {
    id: 'm3max',
    name: 'Apple Silicon (M3/M4 Max 64GB+)',
    category: 'Apple Silicon',
    powerWatts: 65,
    monthlyRevenueEst: 45,
    protocols: ['io.net (Apple Silicon Pool)'],
    recommendation: 'High unified memory allows serving 70B quantized models at ultra-low power.',
  },
  {
    id: 'minipc',
    name: 'Intel N100 Mini PC / Raspberry Pi 5',
    category: 'Edge / Bandwidth',
    powerWatts: 12,
    monthlyRevenueEst: 25,
    protocols: ['Grass', 'Dawn Internet', 'Nodepay', 'Gradient'],
    recommendation: 'Extreme energy efficiency (<$1.50/mo electricity) for 24/7 bandwidth farming.',
  },
];

export default function NodeYieldCalculator() {
  const [selectedId, setSelectedId] = useState<string>('rtx4090');
  const [quantity, setQuantity] = useState<number>(1);
  const [kwhCost, setKwhCost] = useState<number>(0.12);
  const [uptimeHours, setUptimeHours] = useState<number>(24);

  const hardwareSelectId = useId();
  const quantityInputId = useId();
  const electricityInputId = useId();
  const uptimeInputId = useId();

  const hardware = HARDWARE_PRESETS.find((h) => h.id === selectedId) || HARDWARE_PRESETS[2];

  // Calculations
  const hoursPerMonth = (uptimeHours * 365) / 12;
  const monthlyKwh = (hardware.powerWatts * quantity * hoursPerMonth) / 1000;
  const monthlyElectricCost = monthlyKwh * kwhCost;
  const uptimeFactor = uptimeHours / 24;
  const grossMonthlyYield = hardware.monthlyRevenueEst * quantity * uptimeFactor;
  const netMonthlyProfit = grossMonthlyYield - monthlyElectricCost;
  const efficiencyRatio = monthlyElectricCost > 0 ? (grossMonthlyYield / monthlyElectricCost).toFixed(1) : '∞';

  return (
    <div className="surface" style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)', marginBlock: '2.5rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.75rem' }}>
        <div>
          <span className="eyebrow">Interactive Simulator</span>
          <h3 style={{ margin: '.2rem 0 0', font: '800 1.6rem var(--font-display)' }}>Node Hardware &amp; Yield Calculator</h3>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem', padding: '.4rem .8rem', background: 'var(--surface-raised)', borderRadius: '.6rem', fontSize: '.8rem', color: 'var(--muted)' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }}></span>
          Updated for Q4 2026 Metrics
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
        {/* Input Parameters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label htmlFor={hardwareSelectId} style={{ display: 'block', fontSize: '.85rem', fontWeight: 700, marginBottom: '.4rem', color: 'var(--muted)' }}>
              Target Hardware Profile
            </label>
            <select
              id={hardwareSelectId}
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              style={{
                width: '100%',
                padding: '.75rem .9rem',
                borderRadius: '.6rem',
                border: '1px solid var(--line)',
                background: 'var(--bg)',
                color: 'var(--text)',
                fontSize: '.95rem',
                cursor: 'pointer'
              }}
            >
              {HARDWARE_PRESETS.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} — ({h.category})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label htmlFor={quantityInputId} style={{ display: 'block', fontSize: '.85rem', fontWeight: 700, marginBottom: '.4rem', color: 'var(--muted)' }}>
                Units / Nodes
              </label>
              <input
                id={quantityInputId}
                type="number"
                min={1}
                max={64}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                style={{
                  width: '100%',
                  padding: '.7rem .9rem',
                  borderRadius: '.6rem',
                  border: '1px solid var(--line)',
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  fontSize: '.95rem'
                }}
              />
            </div>
            <div>
              <label htmlFor={electricityInputId} style={{ display: 'block', fontSize: '.85rem', fontWeight: 700, marginBottom: '.4rem', color: 'var(--muted)' }}>
                Electric ($/kWh)
              </label>
              <input
                id={electricityInputId}
                type="number"
                step="0.01"
                min={0}
                value={kwhCost}
                onChange={(e) => setKwhCost(Math.max(0, parseFloat(e.target.value) || 0))}
                style={{
                  width: '100%',
                  padding: '.7rem .9rem',
                  borderRadius: '.6rem',
                  border: '1px solid var(--line)',
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  fontSize: '.95rem'
                }}
              />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.85rem', fontWeight: 700, marginBottom: '.4rem' }}>
              <label htmlFor={uptimeInputId} style={{ color: 'var(--muted)' }}>Average Daily Uptime</label>
              <span style={{ color: 'var(--accent)' }}>{uptimeHours} hrs / day</span>
            </div>
            <input
              id={uptimeInputId}
              type="range"
              min={6}
              max={24}
              step={1}
              value={uptimeHours}
              onChange={(e) => setUptimeHours(parseInt(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent)' }}
            />
          </div>

          <div style={{ padding: '1rem', borderRadius: '.6rem', background: 'var(--surface-raised)', border: '1px solid var(--line)' }}>
            <div style={{ fontSize: '.8rem', color: 'var(--muted)', marginBottom: '.3rem' }}>RECOMMENDED PROTOCOLS:</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem', marginBottom: '.75rem' }}>
              {hardware.protocols.map((p) => (
                <span key={p} style={{ padding: '.2rem .6rem', borderRadius: '.4rem', background: 'var(--bg)', color: 'var(--accent)', fontSize: '.8rem', fontWeight: 700 }}>
                  {p}
                </span>
              ))}
            </div>
            <p style={{ margin: 0, fontSize: '.85rem', color: 'var(--muted)', lineHeight: 1.45 }}>{hardware.recommendation}</p>
          </div>
        </div>

        {/* Results Matrix */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'var(--bg)', borderRadius: '1rem', padding: '1.5rem', border: '1px solid var(--line)' }}>
          <div>
            <div style={{ fontSize: '.75rem', textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--muted)', fontWeight: 800 }}>ESTIMATED MONTHLY NET VALUE</div>
            <div style={{ font: '900 clamp(2.4rem, 5vw, 3.2rem)/1.1 var(--font-display)', color: netMonthlyProfit >= 0 ? 'var(--accent)' : 'var(--danger)', margin: '.5rem 0 1rem' }}>
              ${netMonthlyProfit.toFixed(2)}
            </div>
            <p style={{ fontSize: '.85rem', color: 'var(--muted)', margin: 0 }}>
              Based on network reward benchmarks minus estimated power expenses.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBlock: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--line)' }}>
            <div>
              <div style={{ fontSize: '.75rem', color: 'var(--muted)', fontWeight: 600 }}>EST. REWARDS</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)' }}>${grossMonthlyYield.toFixed(2)}</div>
            </div>
            <div>
              <div style={{ fontSize: '.75rem', color: 'var(--muted)', fontWeight: 600 }}>ELECTRICITY COST</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f87171' }}>-${monthlyElectricCost.toFixed(2)}</div>
            </div>
            <div>
              <div style={{ fontSize: '.75rem', color: 'var(--muted)', fontWeight: 600 }}>POWER CONSUMPTION</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)' }}>{(monthlyKwh).toFixed(1)} kWh/mo</div>
            </div>
            <div>
              <div style={{ fontSize: '.75rem', color: 'var(--muted)', fontWeight: 600 }}>EFFICIENCY MULTIPLIER</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent)' }}>{efficiencyRatio}x</div>
            </div>
          </div>

          <div style={{ fontSize: '.75rem', color: 'var(--muted)', lineHeight: 1.4 }}>
            * Educational simulation only. DePIN token rewards vary by network epoch, geographical IP verification, and active compute tenancy.
          </div>
        </div>
      </div>
    </div>
  );
}
