import axios from "axios";
import { downloadData, imageExtensions } from "../../utils/download.util";
import { DeepAiChatRole, DeepAiModelEnum } from "../enums";
import { IChatDeepAi } from "../types/ai.type";
import FormData from "form-data"; // ✅ dùng default import

export async function chatDeepAi(data: IChatDeepAi) {
  const { style, content, history = [], model, url } = data;
  const UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3";
  if (url && model == DeepAiModelEnum.ONLINE)
    throw new Error("Model online not support url");

  const media = url
    ? await downloadData({ url, includesExt: imageExtensions })
    : null;

  if (history.length > 0) {
    const lastMessage = history[history.length - 1];
    if (lastMessage.role === DeepAiChatRole.USER) {
      throw new Error("last message must be from assistant");
    }
  }

  history.push({
    role: DeepAiChatRole.USER,
    content,
  });
  const form = new FormData();
  form.append("chat_style", style);
  form.append("chatHistory", JSON.stringify(history));
  form.append("model", model);
  form.append("hacker_is_stinky", "very_stinky");
  if (media) {
    form.append("file", media.readStream);
  }

  try {
    const { data } = await axios.post(
      "https://api.deepai.org/hacking_is_a_serious_crime",
      form,
      {
        headers: {
          ...form.getHeaders(),
          "api-key": getTrialDeepAiApiKey(UserAgent),
          "user-agent": UserAgent,
        },
      }
    );
    if (!data) {
      throw new Error("No data returned from DeepAI");
    }
    
    return {
      content: data,
      history: [...history, { role: DeepAiChatRole.ASSISTANT, content: data }],
    };
  } catch (error: any) {
    throw new Error(
      "Error in chatDeepAi: " + error?.response?.data
        ? JSON.stringify(error.response.data)
        : error.message
    );
  }
}

function getTrialDeepAiApiKey(UserAgent: string) {
  let myrandomstr = Math.round(Math.random() * 100000000000) + "";
  const myhashfunction = (function () {
    for (var a = [], b = 0; 64 > b; )
      a[b] = 0 | (4294967296 * Math.sin(++b % Math.PI));
    return function (c) {
      var d,
        e,
        f,
        g = [(d = 1732584193), (e = 4023233417), ~d, ~e],
        h = [],
        l: any = unescape(encodeURI(c)) + "\u0080",
        k = l.length;
      c = (--k / 4 + 2) | 15;
      for (h[--c] = 8 * k; ~k; ) h[k >> 2] |= l.charCodeAt(k) << (8 * k--);
      for (b = l = 0; b < c; b += 16) {
        for (
          k = g;
          64 > l;
          k = [
            (f = k[3]),
            d +
              (((f =
                k[0] +
                [
                  (d & e) | (~d & f),
                  (f & d) | (~f & e),
                  d ^ e ^ f,
                  e ^ (d | ~f),
                ][(k = l >> 4)] +
                a[l] +
                ~~h[b | ([l, 5 * l + 1, 3 * l + 5, 7 * l][k] & 15)]) <<
                (k = [
                  7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21,
                ][4 * k + (l++ % 4)])) |
                (f >>> -k)),
            d,
            e,
          ]
        )
          (d = k[1] | 0), (e = k[2]);
        for (l = 4; l; ) g[--l] += k[l];
      }
      for (c = ""; 32 > l; )
        c += ((g[l >> 3] >> (4 * (1 ^ l++))) & 15).toString(16);
      return c.split("").reverse().join("");
    };
  })();
  const tryitApiKey =
    "tryit-" +
    myrandomstr +
    "-" +
    myhashfunction(
      UserAgent +
        myhashfunction(
          UserAgent +
            myhashfunction(
              UserAgent +
                myrandomstr +
                "hackers_become_a_little_stinkier_every_time_they_hack"
            )
        )
    );
  return tryitApiKey;
}
