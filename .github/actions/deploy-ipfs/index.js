import { PinataSDK } from "pinata";
import * as core from "@actions/core";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import FormData from "form-data";

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

    // Count files for logging
    let fileCount = 0;
    function countFiles(dir) {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      for (const item of items) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
          countFiles(fullPath);
        } else {
          fileCount++;
          console.log(`   - ${path.relative(sourceDir, fullPath)}`);
        }
      }
    }

    countFiles(sourceDir);
    console.log(`📦 Found ${fileCount} files to upload`);

    // Create FormData and add files with proper directory structure
    const formData = new FormData();

    function addFilesToFormData(dir, baseDir = dir) {
      const items = fs.readdirSync(dir, { withFileTypes: true });

      for (const item of items) {
        const fullPath = path.join(dir, item.name);

        if (item.isDirectory()) {
          addFilesToFormData(fullPath, baseDir);
        } else {
          const relativePath = path.relative(baseDir, fullPath);
          const fileStream = fs.createReadStream(fullPath);
          // Use 'file' as the field name with the relative path
          formData.append('file', fileStream, {
            filepath: relativePath
          });
        }
      }
    }

    addFilesToFormData(sourceDir);

    // Add metadata
    formData.append('pinataMetadata', JSON.stringify({
      name: 'kannadiga-site'
    }));

    // Add options to wrap with directory
    formData.append('pinataOptions', JSON.stringify({
      wrapWithDirectory: true
    }));

    console.log("🚀 Uploading to Pinata...");

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${pinataJwt}`,
        ...formData.getHeaders()
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${response.status} - ${errorText}`);
    }

    const upload = await response.json();

    console.log("✅ Upload successful!");
    console.log(`📌 CID: ${upload.IpfsHash}`);
    console.log(`🔗 IPFS URL: https://gateway.pinata.cloud/ipfs/${upload.IpfsHash}`);
    console.log(`📄 Access your site: https://gateway.pinata.cloud/ipfs/${upload.IpfsHash}/index.html`);

    // Set outputs for use in other workflow steps
    core.setOutput("cid", upload.IpfsHash);
    core.setOutput("ipfs_url", `https://gateway.pinata.cloud/ipfs/${upload.IpfsHash}`);
    core.setOutput("site_url", `https://gateway.pinata.cloud/ipfs/${upload.IpfsHash}/index.html`);
    core.setOutput("pin_size", upload.PinSize);
    core.setOutput("timestamp", upload.Timestamp);

    // Create a summary
    await core.summary
      .addHeading("🎉 Deployment Successful")
      .addTable([
        [{ data: "Property", header: true }, { data: "Value", header: true }],
        ["CID", upload.IpfsHash],
        ["IPFS URL", `https://gateway.pinata.cloud/ipfs/${upload.IpfsHash}`],
        ["Site URL", `https://gateway.pinata.cloud/ipfs/${upload.IpfsHash}/index.html`],
        ["Pin Size", upload.PinSize.toString()],
        ["Files Uploaded", fileCount.toString()],
        ["Timestamp", upload.Timestamp],
      ])
      .addLink("🌐 View Your Site", `https://gateway.pinata.cloud/ipfs/${upload.IpfsHash}/index.html`)
      .write();

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    core.setFailed(error.message);
  }
}

// Run the upload
uploadDirectoryToPinata();