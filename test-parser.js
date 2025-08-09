const parser = require('./odata-parser-generated.js');

console.log('Testing our new OData parser...\n');

const testCases = [
  '$filter=age eq 42',
  '$filter=not (age eq 42)',
  '$filter=concat(FirstName, \'test\') eq \'result\'',
  '$top=10',
  '$skip=5',
  '$select=name,age',
  '$orderby=name desc',
  '$filter=age gt 18 and name eq \'John\'',
  '$filter=substringof(\'test\', name)',
  '$filter=startswith(\'John\', name)',
  '$filter=tolower(name) eq \'john\'',
  '$filter=year(date) eq 2023',
  '$filter=(age gt 18) or (name eq \'admin\')',
  '$top=10&$skip=20&$select=name,email'
];

testCases.forEach((testCase, i) => {
  console.log(`Test ${i + 1}: ${testCase}`);
  try {
    const result = parser.parse(testCase);
    console.log('✓ Success:', JSON.stringify(result, null, 2));
  } catch (e) {
    console.log('✗ Failed:', e.message);
    if (e.location) {
      console.log('  Location:', e.location);
      console.log('  Expected:', e.expected?.slice(0, 3));
    }
  }
  console.log('');
});