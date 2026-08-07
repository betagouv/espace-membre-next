import { getSignedUrl } from "@/lib/actions/image";

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
