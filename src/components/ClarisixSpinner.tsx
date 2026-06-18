import { useState, useEffect } from 'react';

const SPINNER_VERBS = [
  'Accomplishing', 'Accelerating', 'Aggregating', 'Amplifying', 'Architecting',
  'Assembling', 'Balancing', 'Bamboozling', 'Beboppin\'', 'Bootstrapping',
  'Boondoggling', 'Brewing', 'Buffering', 'Calculating', 'Calibrating',
  'Cascading', 'Catalyzing', 'Channeling', 'Churning', 'Coalescing',
  'Compiling', 'Composing', 'Computing', 'Conjuring', 'Containerizing',
  'Crunching', 'Crystallizing', 'Curating', 'Decrypting', 'Defragmenting',
  'Deploying', 'Digesting', 'Discombobulating', 'Dispatching', 'Distilling',
  'Energizing', 'Engineering', 'Fabricating', 'Fetching', 'Finagling',
  'Fine-tuning', 'Flibbertigibbeting', 'Forging', 'Formulating', 'Galvanizing',
  'Generating', 'Harmonizing', 'Hashing', 'Herding', 'Hullaballooing',
  'Hydrating', 'Igniting', 'Indexing', 'Interpolating', 'Iterating',
  'Juggling', 'Kerfuffling', 'Knitting', 'Lollygagging', 'Magnetizing',
  'Manifesting', 'Marshalling', 'Massaging', 'Materializing', 'Minifying',
  'Mobilizing', 'Moonwalking', 'Multiplexing', 'Normalizing', 'Noodling',
  'Optimizing', 'Orchestrating', 'Paginating', 'Parallelizing', 'Parsing',
  'Percolating', 'Pixelating', 'Polishing', 'Preparing', 'Processing',
  'Propagating', 'Provisioning', 'Puzzling', 'Querying', 'Razzmatazzing',
  'Rebasing', 'Recalibrating', 'Reconciling', 'Refactoring', 'Rendering',
  'Resolving', 'Restructuring', 'Rummaging', 'Scheming', 'Serializing',
  'Shenaniganing', 'Shilly-shallying', 'Shuffling', 'Skedaddling', 'Smelting',
  'Spinning', 'Spooling', 'Streamlining', 'Summoning', 'Synthesizing',
  'Tabulating', 'Tessellating', 'Tokenizing', 'Transpiling', 'Turbocharging',
  'Unboxing', 'Unfurling', 'Unlocking', 'Unscrambling', 'Untangling',
  'Vectorizing', 'Virtualizing', 'Waltzing', 'Whatchamacalliting',
  'Wibble-wobbling', 'Wrangling', 'Zigzagging',
];

function nameToVerb(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed.length < 2) return null;
  const vowels = 'aeiouAEIOU';
  // Find where trailing vowels start
  let consonantEnd = trimmed.length;
  for (let i = trimmed.length - 1; i >= 0; i--) {
    if (!vowels.includes(trimmed[i])) { consonantEnd = i + 1; break; }
  }
  const base = trimmed.slice(0, consonantEnd);
  // If stripping leaves a strong root (3+ chars), use it; otherwise keep full name
  if (base.length >= 3 && consonantEnd < trimmed.length) return base + 'ing';
  return trimmed + 'ing';
}

function useSpinnerVerb(): string {
  const [verb, setVerb] = useState(() => SPINNER_VERBS[Math.floor(Math.random() * SPINNER_VERBS.length)]);

  useEffect(() => {
    const userName = localStorage.getItem('cx_user_name') || 'Claudiu';
    const personVerb = nameToVerb(userName);

    const interval = setInterval(() => {
      if (personVerb && Math.random() < 1 / 3) {
        setVerb(personVerb);
      } else {
        setVerb(SPINNER_VERBS[Math.floor(Math.random() * SPINNER_VERBS.length)]);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return verb;
}

export function ClarisixSpinner({ size = 48 }: { size?: number }) {
  return (
    <img
      src="/Untitled_design_(3).png"
      alt="Loading..."
      className="clarisix-spinner"
      style={{ width: size, height: size }}
    />
  );
}

function SpinnerMessage({ fallback }: { fallback?: string }) {
  const verb = useSpinnerVerb();
  return <>{fallback ?? `${verb}...`}</>;
}

export function TableLoader({ message }: { message?: string }) {
  return (
    <div className="table-loader">
      <ClarisixSpinner size={48} />
      <span><SpinnerMessage fallback={message} /></span>
    </div>
  );
}

export function TableOverlay({ message }: { message?: string }) {
  return (
    <div className="table-overlay">
      <ClarisixSpinner size={40} />
      <span style={{ color: '#e2e8f0', fontSize: 13 }}><SpinnerMessage fallback={message} /></span>
    </div>
  );
}

export function SectionLoader({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <ClarisixSpinner size={56} />
      <span className="text-sm text-gray-400 font-medium"><SpinnerMessage fallback={message} /></span>
    </div>
  );
}
