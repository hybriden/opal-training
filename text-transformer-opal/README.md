# Text Transformer Opal Tool

A comprehensive text transformation service built for Optimizely Opal, providing multiple text processing capabilities including case transformation, encoding/decoding, and text analysis.

## Features

This Opal tool provides 5 different text transformation tools:

1. **case-transform**: Transform text between different case styles
   - uppercase, lowercase, titlecase
   - camelCase, PascalCase, snake_case, kebab-case
   - reverse (reverse string)

2. **base64-transform**: Encode and decode Base64
   - Encode text to Base64
   - Decode Base64 to text

3. **url-transform**: URL encoding and decoding
   - URL encode text
   - URL decode text

4. **text-analysis**: Analyze text and get statistics
   - Character count (with and without spaces)
   - Word count
   - Line count
   - Sentence count

5. **text-cleanup**: Clean up text formatting
   - Trim whitespace
   - Remove extra spaces

## Installation

### Local Development

1. Install dependencies:
```bash
npm install
```

2. Run in development mode:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
npm start
```

### Docker

1. Build the Docker image:
```bash
docker build -t opal-text-transformer .
```

2. Run the container:
```bash
docker run -p 3000:3000 opal-text-transformer
```

## API Endpoints

### Discovery Endpoint
```
GET http://localhost:3000/discovery
```

Returns the list of available tools and their schemas.

### Tool Endpoints

All tools are available at:
```
POST http://localhost:3000/tools/{tool-name}
```

## Usage Examples

### Case Transform
```bash
curl -X POST http://localhost:3000/tools/case-transform \
  -H "Content-Type: application/json" \
  -d '{
    "text": "hello world",
    "transformType": "camelcase"
  }'
```

Response:
```json
{
  "original": "hello world",
  "transformed": "helloWorld",
  "transformType": "camelcase",
  "length": 10
}
```

### Base64 Transform
```bash
curl -X POST http://localhost:3000/tools/base64-transform \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello, World!",
    "operation": "encode"
  }'
```

Response:
```json
{
  "original": "Hello, World!",
  "result": "SGVsbG8sIFdvcmxkIQ==",
  "operation": "encode",
  "success": true
}
```

### URL Transform
```bash
curl -X POST http://localhost:3000/tools/url-transform \
  -H "Content-Type: application/json" \
  -d '{
    "text": "hello world & more",
    "operation": "encode"
  }'
```

Response:
```json
{
  "original": "hello world & more",
  "result": "hello%20world%20%26%20more",
  "operation": "encode",
  "success": true
}
```

### Text Analysis
```bash
curl -X POST http://localhost:3000/tools/text-analysis \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello world! This is a test."
  }'
```

Response:
```json
{
  "text": "Hello world! This is a test.",
  "statistics": {
    "characters": 28,
    "charactersNoSpaces": 24,
    "words": 6,
    "lines": 1,
    "sentences": 2
  }
}
```

### Text Cleanup
```bash
curl -X POST http://localhost:3000/tools/text-cleanup \
  -H "Content-Type: application/json" \
  -d '{
    "text": "  Hello    world  ",
    "removeExtraSpaces": true
  }'
```

Response:
```json
{
  "original": "  Hello    world  ",
  "cleaned": "Hello world",
  "bytesRemoved": 8
}
```

## Integration with Optimizely Opal

To integrate this tool with Optimizely Opal:

1. Deploy the service to your infrastructure
2. Register the service URL in your Opal configuration
3. Use the tools in your Opal policies

## Development

### Project Structure
```
text-transformer-opal/
├── src/
│   └── index.ts          # Main application file
├── dist/                 # Compiled JavaScript (generated)
├── node_modules/         # Dependencies (generated)
├── package.json          # Project configuration
├── tsconfig.json         # TypeScript configuration
├── Dockerfile            # Docker configuration
├── .dockerignore         # Docker ignore patterns
└── README.md             # This file
```

### Technology Stack
- TypeScript 5.1.6
- Express 4.18.2
- @optimizely-opal/opal-tools-sdk 0.1.0-dev
- Node.js 20+

## License

MIT
