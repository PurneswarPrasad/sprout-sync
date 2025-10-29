// Parse markdown-style health note and extract structured data
export const parseHealthNote = (note: string) => {
  const lines = note.split('\n');
  const result: {
    hasIssue: boolean;
    issue?: string;
    description?: string;
    affected?: string;
    careSteps?: string;
    additionalNotes?: string;
    isHealthy?: boolean;
  } = {
    hasIssue: false,
  };

  let currentSection = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    if (!trimmed) continue;
    
    // Check for issue detected
    if (trimmed.includes('Issue Detected:') || trimmed.includes('🔍')) {
      result.hasIssue = true;
      const issueMatch = trimmed.match(/(?:🔍\s*)?\*\*Issue Detected:\s*(.+?)\*\*/i) || 
                        trimmed.match(/Issue Detected:\s*(.+?)(?:\*\*|$)/i) ||
                        trimmed.match(/\*\*Issue Detected:\s*(.+?)\*\*/i);
      if (issueMatch) {
        result.issue = issueMatch[1].trim();
      }
      currentSection = '';
      continue;
    }

    // Check for healthy plant
    if (trimmed.includes('Plant appears healthy') || (trimmed.includes('✅') && trimmed.includes('healthy'))) {
      result.isHealthy = true;
      result.hasIssue = false;
      currentSection = 'healthy';
      continue;
    }

    // Check for description
    if (trimmed.includes('**Description:**') || trimmed.match(/^\*\*Description:\*\*/i)) {
      currentSection = 'description';
      const match = trimmed.match(/\*\*Description:\*\*\s*(.+)/i);
      if (match && match[1].trim()) {
        result.description = match[1].trim();
      } else {
        // Check next line if description is on new line
        if (i + 1 < lines.length && lines[i + 1].trim()) {
          result.description = lines[i + 1].trim().replace(/\*\*/g, '');
          i++;
        }
      }
      continue;
    }

    // Check for affected plants
    if (trimmed.includes('**Affected') || trimmed.match(/^\*\*Affected/)) {
      currentSection = 'affected';
      const match = trimmed.match(/\*\*Affected[^:]*:\*\*\s*(.+)/i);
      if (match && match[1].trim()) {
        result.affected = match[1].trim();
      } else {
        // Check next line if affected is on new line
        if (i + 1 < lines.length && lines[i + 1].trim()) {
          result.affected = lines[i + 1].trim().replace(/\*\*/g, '');
          i++;
        }
      }
      continue;
    }

    // Check for care steps
    if (trimmed.includes('**Care Steps:**') || trimmed.match(/^\*\*Care Steps:\*\*/i)) {
      currentSection = 'careSteps';
      const match = trimmed.match(/\*\*Care Steps:\*\*\s*(.+)/i);
      if (match && match[1].trim()) {
        result.careSteps = match[1].trim();
      } else {
        // Check next line if care steps is on new line
        if (i + 1 < lines.length && lines[i + 1].trim()) {
          result.careSteps = lines[i + 1].trim().replace(/\*\*/g, '');
          i++;
        }
      }
      continue;
    }

    // Check for additional notes
    if (trimmed.includes('**Additional Notes:**') || trimmed.match(/^\*\*Additional Notes:\*\*/i)) {
      currentSection = 'additionalNotes';
      const match = trimmed.match(/\*\*Additional Notes:\*\*\s*(.+)/i);
      if (match && match[1].trim()) {
        result.additionalNotes = match[1].trim();
      }
      continue;
    }

    // Accumulate content for current section (multi-line support)
    if (currentSection && trimmed) {
      const cleanText = trimmed.replace(/\*\*/g, '');
      
      if (currentSection === 'description') {
        if (result.description) {
          result.description += ' ' + cleanText;
        } else {
          result.description = cleanText;
        }
      } else if (currentSection === 'affected') {
        if (result.affected) {
          result.affected += ' ' + cleanText;
        } else {
          result.affected = cleanText;
        }
      } else if (currentSection === 'careSteps') {
        if (result.careSteps) {
          result.careSteps += ' ' + cleanText;
        } else {
          result.careSteps = cleanText;
        }
      } else if (currentSection === 'additionalNotes') {
        if (result.additionalNotes) {
          result.additionalNotes += '\n' + cleanText;
        } else {
          result.additionalNotes = cleanText;
        }
      } else if (currentSection === 'healthy') {
        if (!result.description || result.description.includes('No significant')) {
          if (result.description) {
            result.description += ' ' + cleanText;
          } else {
            result.description = cleanText;
          }
        }
      }
    }
  }

  return result;
};

