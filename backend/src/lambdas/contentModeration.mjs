// AWS SDK v3 imports
import {
  RekognitionClient,
  DetectModerationLabelsCommand,
} from "@aws-sdk/client-rekognition";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

// Initialize AWS services
const rekognitionClient = new RekognitionClient({ region: "eu-west-1" });
const s3Client = new S3Client({ region: "eu-west-1" });

export const handler = async (event) => {
  console.log("Received event:", JSON.stringify(event, null, 2));

  try {
    // Process each SQS record
    for (const record of event.Records) {
      console.log("Processing SQS record:", record.messageId);

      // Parse the S3 event from SQS message body
      const s3Event = JSON.parse(record.body);
      console.log("S3 Event:", JSON.stringify(s3Event, null, 2));

      // Process each S3 record within the SQS message
      for (const s3Record of s3Event.Records) {
        const bucket = s3Record.s3.bucket.name;
        const key = decodeURIComponent(
          s3Record.s3.object.key.replace(/\+/g, " ")
        );

        console.log(`Processing image: ${key} from bucket: ${bucket}`);

        await processImage(bucket, key);
      }
    }

    console.log("Successfully processed all records");
    return { statusCode: 200, body: "Success" };
  } catch (error) {
    console.error("Error processing moderation:", error);
    throw error; // This ensures SQS will retry the message
  }
};

async function processImage(bucket, key) {
  try {
    console.log(`Starting moderation for image: ${key}`);

    console.log(`Calling Rekognition for image: ${key}`);

    // Call Rekognition to detect moderation labels
    const moderationLabels = await checkForInappropriateContent(bucket, key);
    console.log(
      "Rekognition response:",
      JSON.stringify(moderationLabels, null, 2)
    );

    // Check if any inappropriate content was detected
    const inappropriateContent = moderationLabels.filter(
      (label) => label.Confidence > 80
    );

    if (inappropriateContent.length > 0) {
      console.log("Inappropriate content detected:", inappropriateContent);

      // Delete the image
      await deleteImage(bucket, key);
      console.log(`Deleted inappropriate image: ${key}`);
    } else {
      console.log(
        `Image ${key} passed moderation - no inappropriate content detected`
      );
    }
  } catch (error) {
    console.error(`Error processing image ${key}:`, error);
    throw error;
  }
}

async function checkForInappropriateContent(bucket, key) {
  const command = new DetectModerationLabelsCommand({
    Image: {
      S3Object: {
        Bucket: bucket,
        Name: key,
      },
    },
    MinConfidence: 50, // Lower threshold to catch more potential issues
  });

  try {
    const response = await rekognitionClient.send(command);
    return response.ModerationLabels || [];
  } catch (error) {
    console.error("Error calling Rekognition:", error);
    throw error;
  }
}

async function deleteImage(bucket, key) {
  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  try {
    await s3Client.send(command);
    console.log(`Successfully deleted object: ${key} from bucket: ${bucket}`);
  } catch (error) {
    console.error(`Error deleting object ${key}:`, error);
    throw error;
  }
}
