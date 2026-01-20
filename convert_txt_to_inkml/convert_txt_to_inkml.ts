import { createReadStream, writeFileSync } from 'fs';
import * as readline from 'node:readline';

const PRINT_WIDTH = 80;

/**
 * Write to file a row
 *
 * @param file_name - Name of file to write to
 * @param data - Content to write
 * @param indent_count - Number of tabs for indentation
 */
const write_file = async (
  file_name: string,
  data: string,
  indent_count: number = 0,
): Promise<void> => {
  writeFileSync(file_name, '\t'.repeat(indent_count) + data + '\n', { flag: 'a' });
};

/**
 * Write to file the end of a trace
 *
 * @remarks
 * Calls write_file
 *
 * @param file_name - Name of file to write to
 * @param trace - Row of coordinates
 */
const write_file_trace = async (file_name: string, trace: string): Promise<void> => {
  if (trace !== '') {
    write_file(file_name, trace, 2);
  }
  write_file(file_name, '</trace>', 1);
};

/**
 * Convert file format from .txt to .inkml
 *
 * @remarks
 * Calls write_file_trace and write_file
 *
 * @param file_name - Name of file to convert from .txt to .inkml
 */
const convert_txt_to_inkml = async (file_name: string): Promise<void> => {
  const inkml_file_name = file_name.split('.')[0] + '.inkml';
  let trace = '';
  let stroke_count = 0;
  write_file(inkml_file_name, '<ink xmlns="http://www.w3.org/2003/InkML">');
  let total_val_count = -1;
  let in_range_val_count = 0;
  let decimal_places_count = -1;
  // At least half of the coordinates should correspond to the same number of decimal places
  while (in_range_val_count / total_val_count < 0.5) {
    total_val_count = 0;
    in_range_val_count = 0;
    ++decimal_places_count;
    // readline.Interface for rounding values
    const rl_round = readline.createInterface({
      input: createReadStream(file_name),
      crlfDelay: Infinity,
    });
    for await (const line of rl_round) {
      const val_array = line.match(/[0-9]*\.?[0-9]+/g);
      if (val_array) {
        total_val_count += val_array.length;
        val_array.forEach((val) => {
          const val_float = parseFloat(val);
          // Determine whether value is close enough
          if (
            Math.abs(val_float - parseFloat(val_float.toFixed(decimal_places_count))) <
            Math.pow(10, -(decimal_places_count + 2))
          ) {
            ++in_range_val_count;
          }
        });
      }
    }
  }
  // readline.Interface for converting file formats
  const rl_convert = readline.createInterface({
    input: createReadStream(file_name),
    crlfDelay: Infinity,
  });
  for await (const line of rl_convert) {
    if (line.startsWith('Stroke')) {
      if (stroke_count > 0) {
        write_file_trace(inkml_file_name, trace);
        trace = '';
      }
      write_file(inkml_file_name, '<trace>', 1);
      ++stroke_count;
    } else {
      // Prevent row from getting too long
      if (trace.length > PRINT_WIDTH) {
        write_file(inkml_file_name, trace + ',', 2);
        trace = '';
      }
      if (trace !== '') {
        trace += ', ';
      }
      const val_array = line.match(/[0-9]*\.?[0-9]+/g);
      if (val_array) {
        trace +=
          parseFloat(val_array[0]).toFixed(decimal_places_count) +
          ' ' +
          parseFloat(val_array[1]).toFixed(decimal_places_count);
      }
    }
  }
  if (stroke_count > 0) {
    write_file_trace(inkml_file_name, trace);
  }
  write_file(inkml_file_name, '</ink>');
};

// Convert each .txt file to .inkml
process.argv.forEach((arg, idx) => {
  if (idx > 1) convert_txt_to_inkml(arg);
});
