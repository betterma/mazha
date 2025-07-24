#!/bin/bash

BOOKS_DIR="books"
OUTPUT_JSON="$BOOKS_DIR/books.json"

echo "[" > "$OUTPUT_JSON"

first=1
find "$BOOKS_DIR" -type f ! -name "books.json" ! -name "index.json" | while read -r file; do
    name=$(basename "$file")
    path="$file"
    type="${name##*.}"
    size=$(stat -c %s "$file")
    uploadTime=$(date -Iseconds -r "$file")

    if [ $first -eq 0 ]; then
        echo "," >> "$OUTPUT_JSON"
    fi
    first=0

    cat <<EOF >> "$OUTPUT_JSON"
  {
    "name": "$name",
    "path": "$path",
    "type": "$type",
    "size": $size,
    "uploadTime": "$uploadTime"
  }
EOF
done

echo "]" >> "$OUTPUT_JSON"