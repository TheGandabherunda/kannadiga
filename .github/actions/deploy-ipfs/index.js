const { PinataSDK } = require("pinata");
const fs = require("fs");
const path = require("path");
const mime = require("mime-types");
const { Blob } = require("buffer");

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT,
  pinataGateway: "example.mypinata.cloud", // Gateway not strictly needed for upload, but good practice
});

const srcPath = path.join(__dirname, "../../../src");

async function getFiles(dir) {
  const files = [];
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await getFiles(fullPath));
    } else {
      const buffer = await fs.promises.readFile(fullPath);
      // Important: relativePath acts as the filename in the folder structure
      const relativePath = path.relative(srcPath, fullPath);
      const type = mime.lookup(entry.name) || "application/octet-stream";

      // Node.js 20+ has global File, but we ensure Blob is used for buffer conversion
      const blob = new Blob([buffer]);
      const file = new File([blob], relativePath, { type: type });
      files.push(file);
    }
  }
  return files;
}

async function upload() {
  try {
    console.log("Reading files from src...");
    const files = await getFiles(srcPath);

    if (files.length === 0) throw new Error("No files found!");

    console.log(`Uploading ${files.length} files to Pinata...`);

    // usage of fileArray explicitly creates a folder/directory CID
    const upload = await pinata.upload.public.fileArray(files);

    console.log("Upload Complete!");
    console.log("CID:", upload.cid); // This CID points to the root of the folder
    console.log("Name:", upload.name);
  } catch (error) {
    console.error("Upload failed:", error);
    process.exit(1);
  }
}

upload();