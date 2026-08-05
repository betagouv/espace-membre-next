import { z } from "zod";

import {
  imagePostApiSchema,
  imagePostApiSchemaType,
} from "@/models/actions/image";

class MockFile {
  size: number;
  name: string;
  type: string;
  constructor(buffer: Buffer, name: string, type: string) {
    this.size = buffer.length;
    this.name = name;
    this.type = type;
  }
}

export const FileType = typeof File !== "undefined" ? File : MockFile;

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
