// /lib/azure-blob-storage.ts

import { BlobServiceClient, BlockBlobUploadOptions, ContainerClient } from "@azure/storage-blob";
import { Buffer } from "buffer";

const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const AZURE_STORAGE_CONTAINER_NAME = process.env.AZURE_STORAGE_CONTAINER_NAME;

if (!AZURE_STORAGE_CONNECTION_STRING) {
  console.error("Azure Storage Connection String not found in environment variables.");
  // Potentially throw an error or handle this state if critical at startup
  // For API routes, it will be checked at runtime.
}
if (!AZURE_STORAGE_CONTAINER_NAME) {
  console.error("Azure Storage Container Name not found in environment variables.");
}

let blobServiceClient: BlobServiceClient | null = null;
let containerClient: ContainerClient | null = null;

if (AZURE_STORAGE_CONNECTION_STRING && AZURE_STORAGE_CONTAINER_NAME) {
  blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
  containerClient = blobServiceClient.getContainerClient(AZURE_STORAGE_CONTAINER_NAME);
}

export async function uploadToAzureBlob(
  fileBuffer: Buffer,
  blobName: string, // e.g., "photos/your-business/unique-image.jpg"
  contentType: string // e.g., "image/jpeg"
): Promise<string> {
  if (!containerClient) {
    throw new Error(
      "Azure Storage client not initialized. Check environment variables."
    );
  }

  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  const uploadOptions: BlockBlobUploadOptions = {
    blobHTTPHeaders: { blobContentType: contentType },
  };

  try {
    await blockBlobClient.uploadData(fileBuffer, uploadOptions);
    console.log(`Blob "${blobName}" uploaded successfully to container "${AZURE_STORAGE_CONTAINER_NAME}"`);
    return blockBlobClient.url; // This is the direct URL to the blob
  } catch (error) {
    console.error(`Error uploading blob ${blobName}:`, error);
    throw error; // Re-throw to be caught by the API route
  }
}
