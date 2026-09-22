const { execSync } = require('child_process');
const fs = require('fs');

const [,, command, type, name, ...args] = process.argv;


console.log ("args", args )

if (command === 'generate' && type === 'component') {
  const position = args.includes('--position') 
    ? args[args.indexOf('--position') + 1] 
    : 'after';
  const target = args.includes('--target')
    ? args[args.indexOf('--target') + 1]
    : 'default';

  const build_target = args.includes('--build_target')
    ? args[args.indexOf('--build_target') + 1]
    : 'central';

  console.log ( "build_target", build_target )

  let componentDir = 'components/central'
  if (build_target !== "central") {
    componentDir = `components/views/${build_target}`
  }    

    // Generate Angular component
  execSync(`ng generate component ${componentDir}/${name} --standalone`);
 
  // Add @NDEComponent decorator
  const componentPath = `src/app/${componentDir}/${name}/${name}.component.ts`;

    let content = fs.readFileSync(componentPath, 'utf8');
  
  content = `import { NDEComponent } from 'src/app/decorators/nde-component.decorator';\n${content}`;
  content = content.replace(
    '@Component(',
    `@NDEComponent({ selector: 'nde-${target}', position: '${position}' })\n@Component(`
  );
  
  fs.writeFileSync(componentPath, content);
  
  console.log(`✓ Created NDE component: ${name}`);
  console.log(`  Selector: nde-${target}-${position}`);
}


