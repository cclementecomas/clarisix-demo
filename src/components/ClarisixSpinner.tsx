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

function useSpinnerVerb(): string {
  const [verb, setVerb] = useState(() => SPINNER_VERBS[Math.floor(Math.random() * SPINNER_VERBS.length)]);

  useEffect(() => {
    const interval = setInterval(() => {
      setVerb(SPINNER_VERBS[Math.floor(Math.random() * SPINNER_VERBS.length)]);
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
