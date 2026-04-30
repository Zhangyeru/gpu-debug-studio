import { useEffect, useState } from 'react';
import { fetchSamples, fetchSampleSource } from '../services/api';
import type { ShaderSample } from '../types';

type SampleSelectorProps = {
  onSelect: (source: string, name: string) => void;
};

export default function SampleSelector({ onSelect }: SampleSelectorProps) {
  const [samples, setSamples] = useState<ShaderSample[]>([]);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchSamples()
      .then(setSamples)
      .catch(() => {
        // Samples unavailable — silently ignore
      });
  }, []);

  const handleClick = async (sample: ShaderSample) => {
    setLoading(sample.name);
    try {
      const source = await fetchSampleSource(sample.name);
      onSelect(source, sample.name);
    } catch {
      // Ignore — user can try again
    } finally {
      setLoading(null);
    }
  };

  if (samples.length === 0) return null;

  return (
    <div className="sample-selector">
      {samples.map((s) => (
        <button
          key={s.name}
          className="sample-chip"
          onClick={() => handleClick(s)}
          disabled={loading === s.name}
        >
          {loading === s.name ? 'Loading...' : s.label}
        </button>
      ))}
    </div>
  );
}
