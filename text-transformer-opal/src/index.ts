import express from 'express';
import { ToolsService, tool, ParameterType } from '@optimizely-opal/opal-tools-sdk';
import { Client } from 'ldapts';

// Create Express app
const app = express();
app.use(express.json());

// Create Tools Service
const toolsService = new ToolsService(app);

// Interfaces for tool parameters
interface TextTransformParameters {
  text: string;
  transformType: string;
}

interface Base64Parameters {
  text: string;
  operation: 'encode' | 'decode';
}

interface URLEncodeParameters {
  text: string;
  operation: 'encode' | 'decode';
}

interface ADSyncParameters {
  ldapUrl: string;
  baseDN: string;
  username?: string;
  password?: string;
  searchFilter?: string;
  attributes?: string;
}

/**
 * Text Transformation Tool: Transforms text case
 */
async function caseTransform(parameters: TextTransformParameters) {
  const { text, transformType } = parameters;

  let result: string;

  switch (transformType.toLowerCase()) {
    case 'uppercase':
      result = text.toUpperCase();
      break;
    case 'lowercase':
      result = text.toLowerCase();
      break;
    case 'titlecase':
      result = text.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
      break;
    case 'camelcase':
      result = text.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
        index === 0 ? word.toLowerCase() : word.toUpperCase()
      ).replace(/\s+/g, '');
      break;
    case 'pascalcase':
      result = text.replace(/(?:^\w|[A-Z]|\b\w)/g, (word) =>
        word.toUpperCase()
      ).replace(/\s+/g, '');
      break;
    case 'snakecase':
      result = text.replace(/\s+/g, '_').toLowerCase();
      break;
    case 'kebabcase':
      result = text.replace(/\s+/g, '-').toLowerCase();
      break;
    case 'reverse':
      result = text.split('').reverse().join('');
      break;
    default:
      result = text;
  }

  return {
    original: text,
    transformed: result,
    transformType: transformType,
    length: result.length
  };
}

/**
 * Base64 Encoding/Decoding Tool
 */
async function base64Transform(parameters: Base64Parameters) {
  const { text, operation } = parameters;

  let result: string;

  try {
    if (operation === 'encode') {
      result = Buffer.from(text, 'utf-8').toString('base64');
    } else {
      result = Buffer.from(text, 'base64').toString('utf-8');
    }

    return {
      original: text,
      result: result,
      operation: operation,
      success: true
    };
  } catch (error) {
    return {
      original: text,
      result: null,
      operation: operation,
      success: false,
      error: 'Invalid input for base64 operation'
    };
  }
}

/**
 * URL Encoding/Decoding Tool
 */
async function urlTransform(parameters: URLEncodeParameters) {
  const { text, operation } = parameters;

  let result: string;

  try {
    if (operation === 'encode') {
      result = encodeURIComponent(text);
    } else {
      result = decodeURIComponent(text);
    }

    return {
      original: text,
      result: result,
      operation: operation,
      success: true
    };
  } catch (error) {
    return {
      original: text,
      result: null,
      operation: operation,
      success: false,
      error: 'Invalid input for URL operation'
    };
  }
}

/**
 * Text Analysis Tool: Provides statistics about text
 */
async function textAnalysis(parameters: { text: string }) {
  const { text } = parameters;

  const words = text.trim().split(/\s+/).filter(word => word.length > 0);
  const lines = text.split('\n');
  const characters = text.length;
  const charactersNoSpaces = text.replace(/\s/g, '').length;

  return {
    text: text,
    statistics: {
      characters: characters,
      charactersNoSpaces: charactersNoSpaces,
      words: words.length,
      lines: lines.length,
      sentences: text.split(/[.!?]+/).filter(s => s.trim().length > 0).length
    }
  };
}

/**
 * Text Cleanup Tool: Removes extra whitespace and trims text
 */
async function textCleanup(parameters: { text: string; removeExtraSpaces?: boolean }) {
  const { text, removeExtraSpaces = true } = parameters;

  let result = text.trim();

  if (removeExtraSpaces) {
    // Replace multiple spaces with single space
    result = result.replace(/\s+/g, ' ');
  }

  return {
    original: text,
    cleaned: result,
    bytesRemoved: text.length - result.length
  };
}

/**
 * AD Import Tool: Retrieves data from Active Directory via LDAP
 * This replaces the .NET System.DirectoryServices implementation with a Node.js compatible solution
 */
async function adImport(parameters: ADSyncParameters) {
  const { 
    ldapUrl, 
    baseDN, 
    username, 
    password, 
    searchFilter = '(objectClass=user)',
    attributes = 'cn,mail,sAMAccountName,displayName'
  } = parameters;

  // Parse attributes string into array
  const attributeArray = attributes.split(',').map(attr => attr.trim());

  const client = new Client({
    url: ldapUrl,
    timeout: 30000,
    connectTimeout: 30000
  });

  try {
    // Bind to LDAP server (authenticate)
    if (username && password) {
      await client.bind(username, password);
    } else {
      // Anonymous bind
      await client.bind('', '');
    }

    // Search for users
    const searchOptions = {
      scope: 'sub' as const,
      filter: searchFilter,
      attributes: attributeArray,
      paged: true,
      sizeLimit: 1000
    };

    const { searchEntries } = await client.search(baseDN, searchOptions);

    // Unbind from LDAP server
    await client.unbind();

    return {
      success: true,
      totalEntries: searchEntries.length,
      entries: searchEntries,
      source: ldapUrl,
      baseDN: baseDN,
      filter: searchFilter
    };
  } catch (error) {
    // Ensure we unbind even on error
    try {
      await client.unbind();
    } catch (unbindError) {
      // Ignore unbind errors
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return {
      success: false,
      error: errorMessage,
      source: ldapUrl,
      baseDN: baseDN,
      filter: searchFilter,
      totalEntries: 0,
      entries: []
    };
  }
}


// Register the case transformation tool
tool({
  name: 'case-transform',
  description: 'Transforms text case (uppercase, lowercase, titlecase, camelcase, pascalcase, snakecase, kebabcase, reverse)',
  parameters: [
    {
      name: 'text',
      type: ParameterType.String,
      description: 'Text to transform',
      required: true
    },
    {
      name: 'transformType',
      type: ParameterType.String,
      description: 'Type of transformation: uppercase, lowercase, titlecase, camelcase, pascalcase, snakecase, kebabcase, reverse',
      required: true
    }
  ]
})(caseTransform);

// Register the base64 tool
tool({
  name: 'base64-transform',
  description: 'Encode or decode text using Base64',
  parameters: [
    {
      name: 'text',
      type: ParameterType.String,
      description: 'Text to encode/decode',
      required: true
    },
    {
      name: 'operation',
      type: ParameterType.String,
      description: 'Operation to perform: encode or decode',
      required: true
    }
  ]
})(base64Transform);

// Register the URL encoding tool
tool({
  name: 'url-transform',
  description: 'Encode or decode text for URL usage',
  parameters: [
    {
      name: 'text',
      type: ParameterType.String,
      description: 'Text to encode/decode',
      required: true
    },
    {
      name: 'operation',
      type: ParameterType.String,
      description: 'Operation to perform: encode or decode',
      required: true
    }
  ]
})(urlTransform);

// Register the text analysis tool
tool({
  name: 'text-analysis',
  description: 'Analyzes text and provides statistics (character count, word count, line count, etc.)',
  parameters: [
    {
      name: 'text',
      type: ParameterType.String,
      description: 'Text to analyze',
      required: true
    }
  ]
})(textAnalysis);

// Register the text cleanup tool
tool({
  name: 'text-cleanup',
  description: 'Removes extra whitespace and trims text',
  parameters: [
    {
      name: 'text',
      type: ParameterType.String,
      description: 'Text to clean up',
      required: true
    },
    {
      name: 'removeExtraSpaces',
      type: ParameterType.Boolean,
      description: 'Remove extra spaces (defaults to true)',
      required: false
    }
  ]
})(textCleanup);

// Register the AD import tool
tool({
  name: 'ad-import',
  description: 'Import data from Active Directory via LDAP. Replaces the deprecated System.DirectoryServices with platform-compatible LDAP client.',
  parameters: [
    {
      name: 'ldapUrl',
      type: ParameterType.String,
      description: 'LDAP server URL (e.g., ldap://dc.example.com:389 or ldaps://dc.example.com:636)',
      required: true
    },
    {
      name: 'baseDN',
      type: ParameterType.String,
      description: 'Base Distinguished Name for search (e.g., DC=example,DC=com)',
      required: true
    },
    {
      name: 'username',
      type: ParameterType.String,
      description: 'Username for LDAP bind (optional for anonymous bind)',
      required: false
    },
    {
      name: 'password',
      type: ParameterType.String,
      description: 'Password for LDAP bind (optional for anonymous bind)',
      required: false
    },
    {
      name: 'searchFilter',
      type: ParameterType.String,
      description: 'LDAP search filter (defaults to "(objectClass=user)")',
      required: false
    },
    {
      name: 'attributes',
      type: ParameterType.String,
      description: 'Comma-separated list of attributes to retrieve (defaults to "cn,mail,sAMAccountName,displayName")',
      required: false
    }
  ]
})(adImport);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Text Transformer Opal Service running on port ${PORT}`);
  console.log(`Discovery endpoint: http://localhost:${PORT}/discovery`);
  console.log('\nAvailable tools:');
  console.log('  - case-transform: Transform text case');
  console.log('  - base64-transform: Base64 encode/decode');
  console.log('  - url-transform: URL encode/decode');
  console.log('  - text-analysis: Analyze text statistics');
  console.log('  - text-cleanup: Clean up whitespace');
  console.log('  - ad-import: Import data from Active Directory via LDAP');
});
