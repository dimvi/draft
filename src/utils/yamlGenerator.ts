import yaml from 'js-yaml';
import { WorkflowData } from '../types/workflow';
import { DraftContent } from '../types/draft';

export function generateDraftYAML(data: WorkflowData | Record<string, string | string[]>): string {
  const draftContent: DraftContent = {};

  // Convert workflow data to draft format
  for (const [key, values] of Object.entries(data)) {
    if (typeof values === 'string') {
      // Already a string (from translation)
      draftContent[key] = values;
    } else if (Array.isArray(values)) {
      if (values.length === 1 && key === 'goal') {
        // Goal is a single string
        draftContent[key] = values[0];
      } else if (values.length > 0) {
        // Other fields are arrays
        draftContent[key] = values;
      }
    }
  }

  // Generate YAML
  return yaml.dump(draftContent, {
    indent: 2,
    lineWidth: -1, // No line wrapping
    noRefs: true,
  });
}

export function downloadDraftFile(content: string, filename?: string): void {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const defaultFilename = `draft-${timestamp}.draft`;

  const blob = new Blob([content], { type: 'text/yaml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || defaultFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function formatWorkflowDataForDisplay(data: WorkflowData): string {
  const lines: string[] = [];

  for (const [key, values] of Object.entries(data)) {
    lines.push(`${key}:`);
    values.forEach((value) => {
      lines.push(`  - ${value}`);
    });
    lines.push('');
  }

  return lines.join('\n');
}
