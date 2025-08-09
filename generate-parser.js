const fs = require('fs');
const peg = require('pegjs');

console.log('Generating OData parser from grammar...');

// Read the grammar file
const grammar = fs.readFileSync('./odata-grammar.pegjs', 'utf8');

// Generate the parser
const parser = peg.generate(grammar, {
  output: 'source',
  format: 'commonjs'
});

// Write the generated parser to a file
fs.writeFileSync('./odata-parser-generated.js', parser);

console.log('Parser generated successfully: odata-parser-generated.js');