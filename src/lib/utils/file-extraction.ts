/**
 * Extracts text content from a file
 * Supports .txt, .md, .json, .csv, and .html files
 */
export async function extractTextFromFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        resolve(text);
      } catch (error) {
        reject(new Error("Failed to extract text from file"));
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    // Read as text for supported file types (.txt, .md, .json, .csv, .html)
    reader.readAsText(file);
  });
}
