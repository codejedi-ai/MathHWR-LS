mkdir -p inkml
cp -r PlainTextFormatData/* inkml
find inkml/**/* -name '*.txt' -exec npx tsx convert_txt_to_inkml.ts {} +

