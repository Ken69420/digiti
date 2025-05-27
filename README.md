# Receipt Reader

Tired of spending hours manually entering receipt data? This project was born out of the frustration with repetitive, error-prone data entry. Receipt Reader automates the extraction of information from receipt images, freeing you from tedious tasks and letting you focus on what matters. By harnessing Google Cloud Vision and OpenRouter APIs, it streamlines your workflow and eliminates the hassle of manual input.

## Features

- Upload and process receipt images automatically
- Extract text using Google Cloud Vision and Tesseract.js
- Free for up to 1000 receipt images (Google API limit)

## Getting Started

### Prerequisites

- Node.js installed

### Installation

1. Clone the repository:

   ```bash
   git clone <repo-url>
   cd receipt-reader
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and add your API keys:
   ```
   GOOGLE_CLOUD_VISION_API_KEY=your_google_api_key
   OPENROUTER_API_KEY=your_openrouter_api_key
   ```

### Usage

1. Start the server:
   ```bash
   node index.js
   ```
2. Upload receipt images via the provided endpoint or interface.

## Notes

- Google Cloud Vision API is free for up to 1000 receipt images. Charges apply beyond this limit.
- This tool is designed to automate and simplify receipt data entry for organizations.

## License

MIT
