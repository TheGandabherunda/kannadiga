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

    if (!fs.existsSync(sourceDir)) throw new Error(`Source directory ${sourceDir} not found`);

    // Get all files recursively
    function getFiles(dir) {
      let files = [];
      fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
          files = files.concat(getFiles(fullPath));
        } else {
          files.push({ path: fullPath, name: path.relative(sourceDir, fullPath) });
        }
      });
      return files;
    }

    const files = getFiles(sourceDir);

    console.log(`📁 Found ${files.length} files to upload`);

    const result = await pinata.pinFromFS(sourceDir, { pinataMetadata: { name: pinName } });

    console.log('✅ Upload successful!');
    console.log(`📍 IPFS Hash: ${result.IpfsHash}`);
    const gateway = `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`;
    console.log(`🌍 Gateway URL: ${gateway}`);

    core.setOutput('ipfs-hash', result.IpfsHash);
    core.setOutput('gateway-url', gateway);

  } catch (error) {
    core.setFailed(`Action failed: ${error.message}`);
  }
}

run();
