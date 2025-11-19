import * as core from "@actions/core";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { Readable } from "stream";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function uploadDirectoryToPinata() {
  try {
    // Get inputs from workflow
    const pinataJwt = core.getInput("pinata_jwt");
    const sourceDir = core.getInput("source_dir");

    if (!pinataJwt) {
      throw new Error("PINATA_JWT is required");
    }

    console.log(`📁 Preparing to upload directory: ${sourceDir}`);

    // Collect all files
    const files = [];

    function collectFiles(dir, baseDir = dir) {
      const items = fs.readdirSync(dir, { withFileTypes: true });

      for (const item of items) {
        const fullPath = path.join(dir, item.name);

        if (item.isDirectory()) {
          collectFiles(fullPath, baseDir);
        } else {
          const relativePath = path.relative(baseDir, fullPath);
          files.push({
            path: fullPath,
            name: relativePath
          });
          console.log(`   - ${relativePath}`);
        }
      }
    }

    collectFiles(sourceDir);
    console.log(`📦 Found ${files.length} files to upload`);

    // Create boundary for multipart/form-data
    const boundary = `----WebKitFormBoundary${Math.random().toString(36).substring(2)}`;

    // Build the multipart body manually
    let body = '';

    for (const file of files) {
      const fileContent = fs.readFileSync(file.path);
      const mimeType = getMimeType(file.name);

      body += `--${boundary}\r\n`;
      body += `Content-Disposition: form-data; name="file"; filename="${file.name}"\r\n`;
      body += `Content-Type: ${mimeType}\r\n\r\n`;
      body += fileContent.toString('binary');
      body += '\r\n';
    }

    // Add metadata
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="pinataMetadata"\r\n\r\n`;
    body += JSON.stringify({ name: 'kannadiga-site' });
    body += '\r\n';

    // Add options
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="pinataOptions"\r\n\r\n`;
    body += JSON.stringify({ wrapWithDirectory: true });
    body += '\r\n';

    body += `--${boundary}--\r\n`;

    console.log("🚀 Uploading to Pinata...");

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${pinataJwt}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      },
      body: Buffer.from(body, 'binary')
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${response.status} - ${errorText}`);
    }

    const upload = await response.json();

    console.log("✅ Upload successful!");
    console.log(`📌 CID: ${upload.IpfsHash}`);
    console.log(`🔗 IPFS URL: https://gateway.pinata.cloud/ipfs/${upload.IpfsHash}`);

    // Set outputs
    core.setOutput("cid", upload.IpfsHash);
    core.setOutput("ipfs_url", `https://gateway.pinata.cloud/ipfs/${upload.IpfsHash}`);
    core.setOutput("pin_size", upload.PinSize);

    // Create a summary
    await core.summary
      .addHeading("🎉 Deployment Successful")
      .addTable([
        [{ data: "Property", header: true }, { data: "Value", header: true }],
        ["CID", upload.IpfsHash],
        ["IPFS URL", `https://gateway.pinata.cloud/ipfs/${upload.IpfsHash}`],
        ["Pin Size", upload.PinSize.toString()],
        ["Files", files.length.toString()],
      ])
      .addLink("🌐 View on IPFS", `https://gateway.pinata.cloud/ipfs/${upload.IpfsHash}`)
      .write();

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    console.error("Error details:", error.stack);
    core.setFailed(error.message);
  }
}

function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "application/javascript",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".webp": "image/webp",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
    ".txt": "text/plain",
  };
  return mimeTypes[ext] || "application/octet-stream";
}

// Run the upload
uploadDirectoryToPinata();