"""
Python wrapper for Laura Nguyen's InkML converter
This script provides a Python interface to the TypeScript converter
for integration with Flask and Jupyter notebooks.
"""

import os
import subprocess
import tempfile
from pathlib import Path


class InkMLConverter:
    """
    A wrapper class to interface with the TypeScript InkML converter
    """
    
    def __init__(self, converter_script_path=None):
        # Find the converter script relative to this file
        script_dir = Path(__file__).parent
        self.converter_script = converter_script_path or str(script_dir / "convert_txt_to_inkml.ts")

        # Verify the converter script exists
        if not Path(self.converter_script).exists():
            raise FileNotFoundError(f"Converter script not found: {self.converter_script}")
        
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

    def batch_convert_directory(self, input_dir, output_dir=None):
        """
        Convert all TXT files in a directory to InkML format
        
        Args:
            input_dir (str): Directory containing TXT files
            output_dir (str): Output directory for InkML files (defaults to input_dir)
            
        Returns:
            list: Paths to all generated InkML files
        """
        input_path = Path(input_dir)
        output_path = Path(output_dir) if output_dir else input_path
        output_path.mkdir(parents=True, exist_ok=True)
        
        inkml_files = []
        
        for txt_file in input_path.rglob("*.txt"):
            try:
                inkml_file = self.convert_txt_to_inkml(str(txt_file))
                
                # Move to output directory if different from input
                if output_path != input_path:
                    final_path = output_path / txt_file.with_suffix('.inkml').name
                    os.rename(inkml_file, str(final_path))
                    inkml_files.append(str(final_path))
                else:
                    inkml_files.append(inkml_file)
                    
            except Exception as e:
                print(f"Failed to convert {txt_file}: {e}")
        
        return inkml_files


# Example usage when running as a standalone script
if __name__ == "__main__":
    converter = InkMLConverter()
    
    # Example: Convert a single file
    # converter.convert_txt_to_inkml("example.txt")
    
    # Example: Convert from string content
    # sample_content = """Stroke 1
    # 10.5 20.3
    # 11.2 21.0
    # 12.1 22.5
    # 
    # Stroke 2
    # 15.0 25.0
    # 16.5 26.2
    # 17.8 27.9"""
    # 
    # inkml_path = converter.convert_from_string(sample_content, "sample_output")
    # print(f"Generated InkML file: {inkml_path}")