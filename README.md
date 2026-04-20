# InkML Converter - Mathematical Handwriting Recognition Preprocessing

## Overview

This project contains a TypeScript-based converter that transforms handwritten mathematical symbol data from plain text format to InkML format. This preprocessing step is essential for the mathematical handwriting recognition system that utilizes Legendre-Sobolev coefficients for feature extraction and classification.

## Features

- Converts coordinate data from `.txt` files to standardized InkML format
- Automatic decimal precision detection and adjustment
- Proper XML structure with indentation
- Batch processing capabilities
- Integration-ready for Flask applications

## Project Structure

```
Laura_Nguyen/
├── convert_txt_to_inkml.ts    # Main conversion script
├── run.sh                     # Automation script
├── package.json               # Dependencies
├── README.md                  # This file
├── URA curve to vector notebook.ipynb  # Jupyter notebook for analysis
└── inkml/                     # Output directory for converted files
```

## Installation

1. Ensure you have Node.js and npm/yarn installed
2. Clone the repository
3. Install dependencies:

```bash
npm install
# OR
yarn install
```

## Usage

### Command Line Conversion

Convert individual files:

```bash
npx tsx convert_txt_to_inkml.ts path/to/input.txt
```

Batch convert all files in the dataset:

```bash
./run.sh
```

### Python Flask Integration

The following Python code demonstrates how to integrate the conversion functionality with a Flask application:

```python
import os
import subprocess
import tempfile
from flask import Flask, request, jsonify, send_file
import json

class InkMLConverter:
    """
    A wrapper class to interface with the TypeScript InkML converter
    """
    
    def __init__(self, converter_script_path=None):
        self.converter_script = converter_script_path or "./convert_txt_to_inkml.ts"
        
    def convert_txt_to_inkml(self, txt_file_path):
        """
        Convert a single TXT file to InkML format using the TypeScript converter
        
        Args:
            txt_file_path (str): Path to the input TXT file
            
        Returns:
            str: Path to the generated InkML file
        """
        try:
            # Run the TypeScript converter
            result = subprocess.run([
                "npx", "tsx", self.converter_script, txt_file_path
            ], capture_output=True, text=True, check=True)
            
            # Generate expected output path (same name, different extension)
            inkml_file_path = txt_file_path.rsplit('.', 1)[0] + '.inkml'
            
            return inkml_file_path
        except subprocess.CalledProcessError as e:
            raise Exception(f"Conversion failed: {e.stderr}")
    
    def convert_from_string(self, txt_content, output_filename=None):
        """
        Convert TXT content from a string to InkML format
        
        Args:
            txt_content (str): Content of the TXT file as a string
            output_filename (str): Desired output filename (without extension)
            
        Returns:
            str: Path to the generated InkML file
        """
        # Create a temporary file with the content
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as temp_file:
            temp_file.write(txt_content)
            temp_file_path = temp_file.name
        
        try:
            # Convert the temporary file
            inkml_path = self.convert_txt_to_inkml(temp_file_path)
            
            # If a custom output filename was provided, rename the result
            if output_filename:
                new_inkml_path = temp_file_path.rsplit('.', 1)[0] + '_' + output_filename + '.inkml'
                os.rename(inkml_path, new_inkml_path)
                return new_inkml_path
            
            return inkml_path
        finally:
            # Clean up temporary file
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)


# Flask Application Example
app = Flask(__name__)
converter = InkMLConverter()

@app.route('/convert', methods=['POST'])
def convert_txt_to_inkml():
    """
    Endpoint to convert TXT content to InkML format
    
    Expected payload:
    {
        "txt_content": "String content of the TXT file",
        "filename": "optional filename for output"
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'txt_content' not in data:
            return jsonify({"error": "Missing txt_content in request body"}), 400
        
        txt_content = data['txt_content']
        filename = data.get('filename', None)
        
        # Convert the content
        inkml_path = converter.convert_from_string(txt_content, filename)
        
        # Return the converted file
        return send_file(inkml_path, as_attachment=True, download_name=os.path.basename(inkml_path))
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/convert_file', methods=['POST'])
def convert_uploaded_file():
    """
    Endpoint to convert an uploaded TXT file to InkML format
    """
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400
    
    file = request.files['file']
    
    if file.filename == '' or not file.filename.endswith('.txt'):
        return jsonify({"error": "Invalid file type. Please upload a .txt file"}), 400
    
    try:
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as temp_file:
            file.save(temp_file.name)
            temp_file_path = temp_file.name
        
        # Convert the file
        inkml_path = converter.convert_txt_to_inkml(temp_file_path)
        
        # Clean up temporary input file
        os.remove(temp_file_path)
        
        # Return the converted file
        return send_file(inkml_path, as_attachment=True, download_name=file.filename.replace('.txt', '.inkml'))
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/', methods=['GET'])
def home():
    """
    Home endpoint with API documentation
    """
    return jsonify({
        "message": "InkML Converter API",
        "endpoints": {
            "POST /convert": "Convert TXT content to InkML (JSON payload)",
            "POST /convert_file": "Upload and convert a TXT file to InkML"
        },
        "description": "This service converts handwritten mathematical symbol data from TXT format to InkML format for use in mathematical handwriting recognition systems."
    })

if __name__ == '__main__':
    app.run(debug=True)
```

## Methodology

This project is part of a larger research effort in mathematical handwriting recognition using Legendre-Sobolev coefficients. The conversion to InkML format enables:

- Standardized representation of handwritten mathematical symbols
- Preservation of temporal and spatial information
- Compatibility with various machine learning frameworks
- Efficient feature extraction for classification

## Technical Details

The converter implements several key features:

- **Decimal Precision Detection**: Automatically detects and maintains appropriate decimal precision
- **Stroke Separation**: Properly handles multiple strokes within a single symbol
- **XML Formatting**: Generates properly structured InkML with correct indentation
- **Batch Processing**: Capable of processing entire datasets efficiently

## Future Enhancements

- Add validation for input TXT format
- Implement error handling for malformed input
- Add support for additional input formats
- Optimize for large-scale batch processing

## Credits

Implemented by Laura Nguyen as part of URA-F2022: Mathematical Handwriting Recognition Using Legendre-Sobolev Coefficients.