import { getAllPatterns, getPatternById, savePattern, deletePattern } from '../lib/db';
import { seedPatterns } from '../lib/seeds';

async function main() {
  console.log('Testing LibSQL operations directly...');
  const patterns = await getAllPatterns();
  console.log(`Successfully retrieved ${patterns.length} patterns from SQLite:`);
  for (const p of patterns) {
    console.log(`- ${p.title} (ID: ${p.id}, Level: ${p.difficulty_level}, ${p.head_size_inches}")`);
  }

  // Test single retrieve
  const single = await getPatternById('topi-7line-kasab');
  console.log(`Single pattern retrieved: ${single?.title}`);

  // Test search
  const searchResults = await getAllPatterns('Diamond');
  console.log(`Search for "Diamond": ${searchResults.length} result(s) -> ${searchResults[0]?.title}`);

  console.log('Direct LibSQL verification completed successfully!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Error in direct LibSQL test:', err);
  process.exit(1);
});
