import { TAttachmentContent, TOtherContent } from "zca-js";

export function getContent(
  content: string | TAttachmentContent | TOtherContent
) {
  let msg = "";
  if (typeof content == "string") {
    msg = content;
  } else if (typeof content === "object") {
    msg = content.title;
  } else msg = JSON.stringify(content);

  return msg;
}
