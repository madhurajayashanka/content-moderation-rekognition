import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({ region: "eu-west-1" });

// Generate presigned URL for S3 upload
export const generatePresignedUrl = async (event) => {
  try {
    const { fileName, fileType } = JSON.parse(event.body);

    if (!fileName || !fileType) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type",
        },
        body: JSON.stringify({ error: "fileName and fileType are required" }),
      };
    }

    const bucketName = process.env.BUCKET_NAME;
    const key = `uploads/${Date.now()}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: fileType,
    });

    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 300,
    }); // 5 minutes

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({
        uploadUrl: presignedUrl,
        key: key,
        bucketName: bucketName,
      }),
    };
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({ error: "Failed to generate presigned URL" }),
    };
  }
};

// List images in S3 bucket
export const listImages = async (event) => {
  try {
    const bucketName = process.env.BUCKET_NAME;

    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: "uploads/",
      MaxKeys: 50,
    });

    const response = await s3Client.send(command);

    // Generate presigned URLs for each image
    const images = await Promise.all(
      (response.Contents || []).map(async (obj) => {
        try {
          const getObjectCommand = new GetObjectCommand({
            Bucket: bucketName,
            Key: obj.Key,
          });

          const presignedUrl = await getSignedUrl(s3Client, getObjectCommand, {
            expiresIn: 3600, // 1 hour
          });

          return {
            key: obj.Key,
            lastModified: obj.LastModified,
            size: obj.Size,
            url: presignedUrl,
          };
        } catch (error) {
          console.error(
            `Error generating presigned URL for ${obj.Key}:`,
            error
          );
          return {
            key: obj.Key,
            lastModified: obj.LastModified,
            size: obj.Size,
            url: null, // URL generation failed
          };
        }
      })
    );

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({ images }),
    };
  } catch (error) {
    console.error("Error listing images:", error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({ error: "Failed to list images" }),
    };
  }
};
