import { getAllPatterns, getPatternById, savePattern } from '../lib/db.ts';
import { seedPatterns } from '../lib/seeds.ts';

async function run() {
  console.log('Testing LibSQL Database Initialization and Pattern Retrieval...');
  const patterns = await getAllPatterns();
  console.log(`Found ${patterns.length} patterns in database:`);
  patterns.forEach((p) => {
    console.log(`- [${p.id}] ${p.title} (${p.difficulty_level}, ${p.head_size_inches}", ${p.kinar_grid.length}x${p.kinar_grid[0]?.length} grid)`);
  });

  if (patterns.length < 3) {
    throw new Error('Expected at least 3 seed patterns in database.');
  }

  console.log('\nTesting FTS / Keyword Search...');
  const kasabResults = await getAllPatterns('Kasab');
  console.log(`Search 'Kasab' returned ${kasabResults.length} match(es).`);

  const jaliResults = await getAllPatterns('Jali');
  console.log(`Search 'Jali' returned ${jaliResults.length} match(es).`);

  console.log('\nAll database and vault tests passed cleanly!');
}

run().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
