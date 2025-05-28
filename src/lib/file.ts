// Define a mock file class for environments without File API
class MockFile {
  size: number;
  name: string;
  type: string;
  constructor(buffer: Buffer, name: string, type: string) {
    this.size = buffer.length;
    this.name = name;
    this.type = type;
  }
}

// Use the global File if available, otherwise use MockFile
export const FileType = typeof File !== "undefined" ? File : MockFile;
