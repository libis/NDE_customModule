import * as SharedComponents from './components.registry';

export const sharedComponentMap: Map<string, any> = new Map<string, any>(
  Object.entries(SharedComponents).map(([name, component]) => {
    const selector = convertClassNameToSelector(name);
    return ["libis-"+ selector, component];
  })
);

function convertClassNameToSelector(name: string): string {
  // Example: "HighlightComponent" → "highlight"
  return name
    .replace(/Component$/, '') // remove "Component"
    .replace(/([a-z])([A-Z])/g, '$1-$2') // camelCase → kebab-case
    .toLowerCase();
}
