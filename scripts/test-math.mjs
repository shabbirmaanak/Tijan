import { compressRowToRuns, formatCrochetInstructions } from '../lib/compiler.ts';
import { scalePatternWidth, tileMotifMatrix } from '../lib/scaling.ts';
import { validateCrown, generateFlatCrown } from '../lib/validator.ts';

console.log('--- Testing RLE Crochet Step Compiler ---');
const sampleRow = [1, 1, 1, 0, 0, 2, 2, 2, 2, 1];
const runs = compressRowToRuns(sampleRow);
console.log('Sample Row Runs:', runs);
if (runs.length !== 4 || runs[0].count !== 3 || runs[1].count !== 2 || runs[2].count !== 4 || runs[3].count !== 1) {
  throw new Error('RLE compiler failed!');
}

const palette = {
  0: { name: 'White', hex: '#FFF' },
  1: { name: 'Kasab', hex: '#D4AF37' },
  2: { name: 'Maroon', hex: '#781D22' },
};
const instructions = formatCrochetInstructions([sampleRow], palette);
console.log('Formatted Instruction:', instructions[0]);

console.log('\n--- Testing Size Scaling Engine ---');
const scale = scalePatternWidth(21.0, 10.0, 15);
console.log('Scale 21" @ 10 sts/in with 15-st motif:', scale);
if (scale.repeats !== 14 || scale.totalColumns !== 210 || scale.actualFitInches !== 21.0) {
  throw new Error('Scaling engine failed!');
}

console.log('\n--- Testing Crown Flatness Validator ---');
const validCrown = generateFlatCrown(36, 6);
const validation1 = validateCrown(validCrown, 6);
console.log('Valid Crown Check:', validation1);
if (!validation1.isValid) throw new Error('Valid crown was flagged as invalid!');

const invalidCrown = [
  { round: 1, stitches: 6 },
  { round: 2, stitches: 14 }, // should be 12
  { round: 3, stitches: 18 },
];
const validation2 = validateCrown(invalidCrown, 6);
console.log('Invalid Crown Check (Expected errors):', validation2.errors);
if (validation2.isValid || validation2.errors.length === 0) {
  throw new Error('Invalid crown was not caught!');
}

console.log('\nAll Domain Rules & Math tests passed successfully!');
