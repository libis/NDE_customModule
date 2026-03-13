const { execSync } = require('child_process');
const fs = require('fs');

const [,, command, type, name, ...args] = process.argv;

if (command === 'generate' && type === 'component') {
  const position = args.includes('--position') 
    ? args[args.indexOf('--position') + 1] 
    : 'after';
  const target = args.includes('--target')
    ? args[args.indexOf('--target') + 1]
    : 'default';
  
  // Generate Angular component
  execSync(`ng generate component components/${name} --standalone`);
  
  // Add @NDEComponent decorator
  const componentPath = `src/app/components/${name}/${name}.component.ts`;
  let content = fs.readFileSync(componentPath, 'utf8');
  
  content = `import { NDEComponent } from '../../decorators/nde-component.decorator';\n${content}`;
  content = content.replace(
    '@Component(',
    `@NDEComponent({ selector: 'nde-${target}', position: '${position}' })\n@Component(`
  );
  
  fs.writeFileSync(componentPath, content);
  
  console.log(`✓ Created NDE component: ${name}`);
  console.log(`  Selector: nde-${target}-${position}`);
}