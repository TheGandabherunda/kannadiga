const core = require('@actions/core');
const fs = require('fs');
const path = require('path');
const PinataSDK = require('pinata-sdk');

async function run() {
  try {
    const pinataJwt = core.getInput('pinata-jwt');
    const sourceDir = core.getInput('source-dir');
    const pinName = core.getInput('pin-name');

    const pinata = new PinataSDK({ pinataJwt });

    await pinata.testAuthentication();
    console.log('✅ Pinata authentication successful');

    if (!fs.existsSync(sourceDir)) {
      throw new Error(`Source directory ${sourceDir} does not exist`);
    }

    // Gather all files from sourceDir
    const files = await getAllFiles(sourceDir);
    console.log(`📁 Found ${files.length} files`);

    // Upload files
    const result = await pinata.upload.public.fileArray(files)
      .name(pinName);

    console.log('✅ Upload successful!');
    console.log(`📍 IPFS Hash: ${result.cid}`);
    core.setOutput('ipfs-hash', result.cid);
    core.setOutput('gateway-url', `https://gateway.pinata.cloud/ipfs/${result.cid}`);

  } catch (err) {
    core.setFailed(err.message);
  }
}

async function getAllFiles(dir, arr = []) {
  const entries = fs.readdirSync(dir);

  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    if (fs.statSync(fullPath).isDirectory()) {
      arr = await getAllFiles(fullPath, arr);
    } else {
      arr.push({
        path: path.relative(process.cwd(), fullPath),
        content: fs.readFileSync(fullPath)
      });
    }
  }

  return arr;
}

run();
