import { z } from "zod";

import { FileType } from "@/lib/file";
import {
  imagePostApiSchema,
  imagePostApiSchemaType,
} from "@/models/actions/image";

const saveImageSchema = z.object({
  fileIdentifier: imagePostApiSchema.shape.fileIdentifier,
  fileRelativeObjType: imagePostApiSchema.shape.fileRelativeObjType,
  fileObjIdentifier: imagePostApiSchema.shape.fileObjIdentifier,
  file: z
    .instanceof(FileType)
    .refine((file) => file.size > 0, "File is required"),
});
type saveImageSchemaType = z.infer<typeof saveImageSchema>;

export const saveImage = async ({
  fileIdentifier,
  fileRelativeObjType,
  fileObjIdentifier,
  file,
}: saveImageSchemaType) => {
  const imageBody: imagePostApiSchemaType = {
    fileObjIdentifier,
    fileIdentifier,
    fileRelativeObjType,
    fileType: "image/jpeg",
  };

  const response = await fetch("/api/image", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(imageBody),
  });
  const { signedUrl } = await response.json();

  const uploadResponse = await fetch(signedUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type,
    },
    body: file as File,
  });

  if (uploadResponse.ok) {
    console.log(signedUrl.split("?")[0]);
    console.log("File uploaded successfully");
  } else {
    console.error("Failed to upload file");
  }
};
