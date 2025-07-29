import { TAttachmentContent, TOtherContent } from "zca-js";

export function getContent(
  content: string | TAttachmentContent | TOtherContent
) {
  let msg = "";
  if (typeof content == "string") {
    msg = content;
  } else if (typeof content === "object" && typeof content.title === "string") {
    msg = content.title;
  } else return null

  return msg;
}
