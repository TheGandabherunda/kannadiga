const { PinataSDK } = require("pinata");
const fs = require("fs");
const path = require("path");
const mime = require("mime-types");
const { Blob } = require("buffer");

// Initialize SDK with JWT from environment variables
const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT,
  pinataGateway: "example-gateway.mypinata.cloud", // Optional: Placeholder or your actual gateway
});

// Path to the src directory relative to this script
const srcPath = path.join(__dirname, "../../../src");

async function getFiles(dir) {
  const files = [];
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Recursively get files from subdirectories
      files.push(...await getFiles(fullPath));
    } else {
      const buffer = await fs.promises.readFile(fullPath);
      // Create a relative path (e.g., "assets/logo.svg") to preserve structure
      const relativePath = path.relative(srcPath, fullPath);
      const type = mime.lookup(entry.name) || "application/octet-stream";

      // Create a File object compatible with the SDK
      const file = new File([buffer], relativePath, { type: type });
      files.push(file);
    }
  }
  return files;
}

async function upload() {
  try {
    console.log("Reading files from src...");
    const files = await getFiles(srcPath);

    if (files.length === 0) {
      throw new Error("No files found in src directory!");
    }

    console.log(`Uploading ${files.length} files to Pinata...`);
    const upload = await pinata.upload.public.fileArray(files);

    console.log("Upload Complete!");
    console.log("CID:", upload.cid);
    console.log("Name:", upload.name);
  } catch (error) {
    console.error("Upload failed:", error);
    process.exit(1);
  }
}

upload();