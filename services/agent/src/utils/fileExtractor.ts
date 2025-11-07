/**
 * File Extraction Utility
 * 
 * Utility functions for extracting file references from user queries.
 * Supports @ symbol notation for file references.
 */

export interface FileExtractionResult {
  cleanedQuery: string;
  extractedFiles: string[];
  hasFiles: boolean;
}

/**
 * Extract file references from a query string.
 * Looks for patterns like @filename.ext and extracts the filenames.
 * 
 * @param query - The user query that may contain file references
 * @returns Object containing cleaned query and extracted filenames
 */
export function extractFilesFromQuery(query: string): FileExtractionResult {
  // Regex to match @filename patterns
  // Matches @ followed by filename with optional extension
  const filePattern = /@([a-zA-Z0-9._-]+(?:\.[a-zA-Z0-9]+)?)/g;
  
  const extractedFiles: string[] = [];
  let match;
  
  // Extract all file references
  while ((match = filePattern.exec(query)) !== null) {
    const filename = match[1];
    if (!extractedFiles.includes(filename)) {
      extractedFiles.push(filename);
    }
  }
  
  // Remove file references from the query
  const cleanedQuery = query.replace(filePattern, '').trim();
  
  return {
    cleanedQuery,
    extractedFiles,
    hasFiles: extractedFiles.length > 0
  };
}

export function createFileContextPrompt(files: string[]): string {
  if (files.length === 0) return '';
  
  const fileList = files.map(f => `"${f}"`).join(', ');
  
  return `

IMPORTANT: The user has referenced the following files: ${fileList}
You have access to retrieve_content tool to get the contents of these files.
Always use retrieve_content to get the file contents before answering questions about them.
When the user asks about these files, make sure to retrieve their content first.`;
}