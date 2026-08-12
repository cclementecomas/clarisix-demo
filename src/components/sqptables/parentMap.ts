// Parent→child ASIN grouping for the SQP deep dive (By Parent / By Child pivots).
// SqpRow carries only the child `asin`; this maps each child to its parent so the
// tables can roll rows up to the parent-ASIN grain. Synthetic for the wireframe —
// in production this comes from the catalogue's variation family.

export const PARENT_OF: Record<string, string> = {
  B0DCBQC3JX: 'DEMOPARENT_SOFTPICKS',
  B0DEMOG201: 'DEMOPARENT_SOFTPICKS',
  B0DEMOG205: 'DEMOPARENT_SOFTPICKS',
  B0DEMOG202: 'DEMOPARENT_BRUSHES',
  B0DEMOG203: 'DEMOPARENT_BRUSHES',
  B0DEMOG204: 'DEMOPARENT_BRUSHES',
  B0DEMOG208: 'DEMOPARENT_BRUSHES',
  B0DEMOG206: 'DEMOPARENT_FLOSS',
  B0DEMOG207: 'DEMOPARENT_FLOSS',
};

export const parentOf = (asin: string): string => PARENT_OF[asin] ?? 'DEMOPARENT_OTHER';
