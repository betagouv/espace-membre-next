import { z } from "zod";

import { getSignedUrl } from "@/lib/actions/image";

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

export const saveImage = async ({
  fileIdentifier,
  fileRelativeObjType,
  fileObjIdentifier,
  file,
}: {
  fileIdentifier: string;
  fileRelativeObjType: string;
  fileObjIdentifier: string;
  file: File;
}) => {
  const result = await getSignedUrl({
    fileObjIdentifier,
    fileIdentifier: fileIdentifier as "shot" | "hero" | "avatar" | "logo",
    fileRelativeObjType: fileRelativeObjType as "startup" | "member" | "incubator",
    fileType: "image/jpeg",
  });

  if (!result.success) {
    throw new Error(result.message);
  }

  const { signedUrl } = result.data;
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
